'use strict';
const chatStore = require('../storage/chatStore'),
  logger = require('../logger');

const chatConst = require('../common/const').chat,
  ChatEvent = chatConst.chatEvent;

function ChatManager(chatService) {
  if (!chatService) {
    return;
  }
  let self = this,
    chId = chatService.chId,
    userSocketMap;

  // on ChatService init:
  // - create a local user-socket map inside ChatManager
  // - listen on ChatService's event 

  logger.debug('chatService initialized, id: ', chatService.id);
  userSocketMap = {};

  // on client session established:
  // - ChatService emits an 'online' event to ChatManager
  // - add item in local user-socket map
  // - checkout the user's offline MQ then emit every message within a 'send' event to ChatService
  //  

  chatService.on(ChatEvent.ONLINE, (data) => {
    logger.debug('client logged in: ', data);
    let uid = data.uid;
    userSocketMap[uid] = data.sid;
    // TODO check login user's offline MQ
    fetchOfflineMsg(uid)
      .then()
      .catch(logger.warn);
  });

  function fetchOfflineMsg(uid) {
    return new Promise((resolve, reject) => {
      let fetchPromise = function(){
        return new Promise((resolve, reject) => {
          chatStore.pollFromOfflineMQ(uid)
            .then(resolve)
            .catch(reject);
        })
        .then((msg) => {
          if (msg) {
            logger.debug('fetched offline msg: ', msg);
            // TODO invoke send
            let invokeSendPromise = function() {
              return new Promise((resolve, reject) => {
                // first recursion go on, then async invoke send
                resolve();
                let destSocketId = userSocketMap[uid];
                if (destSocketId) {
                  invokeSend(destSocketId, msg);
                } else {
                  reject(new Error('client disconnected while fetching offline msg, will quit'));
                }
              });
            }
            return invokeSendPromise()
              .then(fetchPromise)
              .catch(reject);
          } else {
            logger.debug('no more offline msg.');
            return;
          }
        })
        .catch(reject);
      };
      return fetchPromise()
        .then(resolve)
        .catch(reject);
    });
  }

  function invokeSend(destSocketId, msg) {
    logger.debug('invoke chat service to send');
    chatService.emit(ChatEvent.SEND, {
      destSocketId: destSocketId,
      msg: msg
    });
  }

  // on a server socket received msg:
  // - ChatService emits a 'recv' event to ChatManager, including to-user-id
  // - ChatManager find local user-socket, if success: emit a 'send' event to ChatService; if failed: user offline, push into the user's offline MQ

  chatService.on(ChatEvent.RECV, (msg) => {
    logger.debug('server received msg: ', msg);

    logger.debug(userSocketMap);
    let toUid = msg.toUid,
      destSocketId = userSocketMap[toUid];
    if (destSocketId) {
      invokeSend(destSocketId, msg);
    } else {
      logger.debug('to-user is offline, store msg in offline MQ.');
      // TODO
      chatStore.offerToOfflineMQ(toUid, msg)
        .then((resolve) => {
          logger.debug('offerToOfflineMQ success: ', toUid, msg);
        })
        .catch((err) => {
          logger.error('offerToOfflineMQ failed: ');
          logger.error(err);
        });
    }
  });

  // on client session destroyed:
  // - ChatService emits an 'offline' event to ChatManager
  // - delete local user-socket
  // - save chat msg to offline MQ

  // TODO

}
require('util').inherits(ChatManager, require('events').EventEmitter);

module.exports = ChatManager;