'use strict';
const fs = require('fs'),
  config = require('../config'),
  ApiError = require('../common/apiError'),
  ErrorCode = require('../common/ErrorCode'),
  ChatSession = require('../models/chatSession'),
  cryptUtils = require('../utils/cryptUtils'),
  userService = require('./userService'),
  cs = new ChatSession();


function ChatSessionService() {}

ChatSessionService.prototype.acquireSession = function(uid, to_uid) {
  return new Promise((resolve, reject) => {
    if ((uid = parseInt(uid)) && (to_uid = parseInt(to_uid))) {
      let param = {
        uid: uid,
        to_uid: to_uid
      };
      cs.get(param)
        .then((data) => {
          if (data) {
            resolve(data);
          } else {
            createSession(param)
              .then(resolve)
              .catch(reject);
          }
        })
        .catch(reject);
    } else {
      return reject(new ApiError('illegal param', ErrorCode.BAD_REQUEST));
    }
  });
}

function checkUser(uid) {
  let err = new ApiError(ErrorCode.NOT_FOUND, 'user not exists!');
  return new Promise((resolve, reject) => {
    if (!uid) {
      return reject(err);
    }
    userService.get(uid)
      .then((user) => {
        if (!user) {
          reject(err);
        }
        resolve();
      })
      .catch(reject);
  })
}

function createSession(data) {
  return new Promise((resolve, reject) => {
    if (!data) {
      return reject(new ApiError('empty args!', ErrorCode.BAD_REQUEST));
    }
    Promise.all([checkUser(data.uid), checkUser(data.to_uid)])
      .then(() => {
        return cs.add(data)
      })
      .then(resolve)
      .catch(reject);
  });
}

ChatSessionService.prototype.updateUnreadCnt = function(uid, to_uid, unreadCnt) {
  return new Promise((resolve, reject) => {
    unreadCnt = parseInt(unreadCnt);
    if (!uid || !to_uid || !(unreadCnt >= 0)) {
      return reject(new ApiError('illegal param', ErrorCode.BAD_REQUEST));
    }
    cs.get({
        uid: uid,
        to_uid: to_uid
      })
      .then((data) => {
        if (!data) {
          return reject(new ApiError('not found', ErrorCode.NOT_FOUND));
        }
        data.unread_cnt = unreadCnt;
        data.update_time = new Date();
        return cs.update(data);
      })
      .catch(reject);
  })
}

ChatSessionService.prototype.getUserSessions = function(uid, score, size, offset) {
  score = score || (new Date()).getTime();
  offset = offset || 0;
  return new Promise((resolve, reject) => {
    if (size <= 0 || offset < 0) {
      return resolve([]);
    }
    cs.getUserSessionList(uid, score, size, offset)
      .then((list)=>{
        resolve(list || []);
      })
      .catch((err)=>{
        logger.error('failed to getUserSessions', err)
        resolve([]);
      })
  });
}

module.exports = new ChatSessionService();