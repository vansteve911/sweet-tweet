'use strict';
const socketIO = require('socket-io'),
  logger = require('../logger'),
  cryptUtils = require('../utils/cryptUtils'),
  SessionStore = require('../storage/sessionStore')({
    store: {}
  }),
  sessionStore = new SessionStore();

const SocketStat = {
  CONNECTED: 0,
  AUTH_SENT: 1,
  CLIENT_AUTH: 2,
  SERVER_AUTH: 3,
  ESTABLISHED: 4
};

const SocketEvents = [
  'auth-req', // s->c, c->s
  'auth-res', // s->c
  'sess-key',
  'sess-start',
  'msg'
];


function Message(args) {
  args = args || {};
  this.body = args.body || '[系统消息]';
  this.note = args.note;
  this.extra = args.extra;
}

function decryptClientData(data) {
  if (!data || !data.data || !data.nonce || !data.sign) {
    logger.warn('empty client data: ', data);
    return null;
  }
  try {
    let sign = data.sign;
    delete data.sign;
    let originStr = cryptUtils.convertToOriginalStr(data);
    if (cryptUtils.verifyClientSignature(originStr, sign)) {
      let decrypted = cryptUtils.rsaPrivateDecrypt(data.data);
      logger.debug('decrypted: ', decrypted);
      return decrypted;
    } else {
      logger.warn('unmatched sign and data, sign: ', sign, ', originStr: ', originStr);
    }
  } catch (err) {
    logger.error('failed to decryptClientData!');
    logger.error(err);
  }
  return null;
}

function genAuthData(input) {
  try {
    let data = cryptUtils.rsaPrivateEncrypt(input),
      nonce = cryptUtils.genNonce(),
      sign = cryptUtils.genServerSignature(cryptUtils.convertToOriginalStr({
        data: data,
        nonce: nonce
      }));
    return {
      data: data,
      nonce: nonce,
      sign: sign
    };
  } catch (err) {
    logger.error('failed to genAuthData!');
    logger.error(err);
  }
  return null;
}

function genSessionMsg(msg, sessKey) {
  // msg content is text in special format; specific html tags are supported.
  if (msg) {
    if (typeof msg === 'object' && msg.body && typeof msg.body === 'string') {

    } else if (typeof msg === 'string') {
      msg = {
        body: msg
      }
    } else {
      logger.warn('invalid msg format: ', msg);
      return null;
    }
    try {
      return cryptUtils.aesEncrypt(JSON.stringify(msg), sessKey);
    } catch (err) {
      logger.error('failed to genSessionMsg! text: ' + text);
      logger.error(err);
    }
  }
  return null;
}

function parseSessionMsg(encrypted, sessKey) {
  if (encrypted) {
    let decrypted = cryptUtils.aesDecrypt(encrypted, sessKey);
    if (decrypted) {
      try {
        return JSON.parse(decrypted);
      } catch (err) {
        logger.error('failed to parseSessionMsg! text: ' + text);
        logger.error(err);
      }
    }
  }
  return null;
}

function ChatService(appServer) {
  this.io = socketIO(appServer);
  this.io.on('connection', (socket) => {
    // TODO ip blacklist filter
    logger.debug('connected! socket: ', socket);
    socket.stat = SocketStatus.CONNECTED;
    socket.sessKeyFactors = {};

    // define disconnect event
    socket.on('disconnect', (socket) => {
      logger.debug('socket closed: ', socket);
    });

    // // TODO check user auth
    // let sid = 
    // sessionStore.get()

    socket.emit('auth-req', {});

    // auth req handler
    socket.on('auth-req', function(data) {
      logger.debug('client auth req: ', data);
      if (socket.stat !== SocketStatus.CONNECTED) {
        logger.error('wrong socket stat: ', socket.stat);
        socket.disconnect();
        return;
      }
      let r1 = decryptClientData(data),
        r2 = cryptUtils.genRnd();
      if (r1) {
        socket.sessKeyFactors.r1 = r1;
        socket.sessKeyFactors.r2 = r2;
        let authData = genAuthData(r2);
        logger.debug('authData: ', authData);
        socket.emit('auth-res', authData);
        socket.stat = SocketStatus.CLIENT_AUTH;
      } else {
        logger.error('client auth failed, data: ', data);
        socket.disconnect();
      }
    });

    // sess key handler
    socket.on('sess-key', function(data) {
      logger.debug('client sess-key req: ', data);
      if (socket.stat !== SocketStatus.CLIENT_AUTH) {
        logger.error('wrong socket stat: ', socket.stat);
        socket.disconnect();
        return;
      } else if (!socket.sessKeyFactors || !socket.sessKeyFactors.r1 || !socket.sessKeyFactors.r2) {
        logger.error('empty sessKey factors: ', socket.sessKeyFactors);
        socket.disconnect();
        return;
      }
      let clientSessKey = decryptClientData(data),
        serverSessKey = cryptUtils.genHash(socket.sessKeyFactors.r1 + '&' + socket.sessKeyFactors.r2);
      logger.debug('clientSessKey: ', clientSessKey, ', serverSessKey: ', serverSessKey);
      if (clientSessKey === serverSessKey) {
        logger.debug('auth success! sess key: ', serverSessKey);
        socket.stat = SocketStatus.ESTABLISHED;
        socket.sessKey = serverSessKey;
        // TODO save user info
        // TODO save session info from client, e.g. to user
        // emit message
        let msg = new Message({
            note: '已经接入了对话'
          }),
          sessMsg = genSessionMsg(msg, sessKey);
        socket.emit('sess-start', sessMsg);
      } else {
        logger.error('sessKey not matched! clientSessKey: ', clientSessKey, ', serverSessKey: ', serverSessKey);
        socket.disconnect();
        return;
      }
    });
    // msg handler
    socket.on('msg', function(data) {
      if (socket.stat !== SocketStatus.ESTABLISHED) {
        logger.error('wrong socket stat: ', socket.stat);
        socket.disconnect();
        return;
      }
      let msg = parseSessionMsg(data);
      logger.info('server received message: ', msg);
      // TODO send to other user
    });
  });
}

module.exports = ChatService;