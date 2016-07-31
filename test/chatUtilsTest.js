'use strict';
const logger = require('../logger'),
  chatUtils = require('../utils/chatUtils');

let f1 = chatUtils.genSessKeyFactor(),
  clientAuthData = chatUtils.genClientAuthData(f1),
  serverF1 = chatUtils.decryptClientAuthData(clientAuthData),
  f2 = chatUtils.genSessKeyFactor(),
  serverAuthData = chatUtils.genServerAuthData(f2),
  clientF2 = chatUtils.decryptServerAuthData(serverAuthData),
  clientSessKey = chatUtils.genSessKey(f1, clientF2),
  serverSessKey = chatUtils.genSessKey(serverF1, f2),
  msg = {
    body: '233333',
    note: '[你爹] 已加入聊天室'
  },
  sentMsg = chatUtils.encryptSessMsg(msg, clientSessKey),
  receivedMsg = chatUtils.decryptSessMsg(sentMsg, serverSessKey);


logger.debug('f1: ', f1,
  'clientAuthData: ', clientAuthData,
  'serverF1: ', serverF1,
  'f2: ', f2,
  'serverAuthData: ', serverAuthData,
  'clientF2: ', clientF2,
  'clientSessKey: ', clientSessKey,
  'serverSessKey: ', serverSessKey,
  'sentMsg: ', sentMsg,
  'receivedMsg: ', receivedMsg);