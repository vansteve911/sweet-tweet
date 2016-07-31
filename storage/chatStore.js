'use strict';
const RedisCache = require('../storage/cache'),
  cacheStore = new RedisCache(),
  logger = require('../logger'),
  keyPrefix = require('../common/const.js').cachePrefix.chat;

const chatConst = require('../common/const').chat,
  ChatEvent = chatConst.chatEvent;

module.exports.offerToOfflineMQ = function(toUid, msg) {
  return new Promise((resolve, reject) => {
    try {
      if (msg && toUid) {
        let key = keyPrefix.offlineUserMsgQueue + toUid,
          value = JSON.stringify(msg);
        return queueOffer(key, value)
          .then(resolve)
          .catch(reject);
      } else {
        let err = new Error('empty msg or toUid: ', msg, toUid);
        logger.error(err);
        reject(err);
      }
    } catch (err) {
      logger.warn('parse msg to string failed: ', msg);
      reject(err);
    }
  });
}

module.exports.pollFromOfflineMQ = function(toUid) {
  return new Promise((resolve, reject) => {
    if(toUid){
      let key = keyPrefix.offlineUserMsgQueue + toUid;
      return queuePoll(key)
      .then(resolve)
      .catch(reject);
    } else {
      let err = new Error('empty toUid: ', toUid);
      logger.error(err);
      reject(err);
    }
  });
}


function queueOffer(key, value) {
  return new Promise((resolve, reject) => {
    cacheStore.lpush({
        key: key,
        value: value
      })
      .then(resolve)
      .catch(reject);
  });
}

function queuePoll(key) {
  return new Promise((resolve, reject) => {
    cacheStore.rpop({
        key: key
      })
      .then(cacheStore.parseObjectResult)
      .then(resolve)
      .catch(reject);
  });
}