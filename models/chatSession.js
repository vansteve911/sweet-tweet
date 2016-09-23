'use strict';
const util = require('util'),
  DB = require('../storage/db'),
  RedisCache = require('../storage/cache'),
  logger = require('../logger'),
  ApiError = require('../common/apiError'),
  ErrorCode = require('../common/errorCode'),
  CommonUtils = require('../utils/commonUtils');

function ChatSession(data) {
  data = data || {};
  this.uid = parseInt(data.uid) || 0;
  this.to_uid = parseInt(data.to_uid) || 0;
  this.unread_cnt = parseInt(data.unread_cnt) || 0;
  this.create_time = CommonUtils.parseDate(data.create_time);
  this.update_time = CommonUtils.parseDate(data.update_time);
}

ChatSession.prototype.get = function(args) {
  let self = this,
    uid, to_uid;
  return new Promise((resolve, reject) => {
    if (args && (uid = args.uid) && (to_uid = args.to_uid)) {
      self.cacheStore.getChatSession(uid, to_uid)
        .then((chatSession) => {
          if (chatSession) {
            resolve(chatSession);
          } else {
            self.dbStore.get(uid, to_uid)
              .then((chatSession) => {
                resolve(chatSession);
                if (chatSession) {
                  self.cacheStore.setChatSession(chatSession)
                    .catch((err) => {
                      logger.error('failed to set chatSession in cache', err);
                    })
                }
              })
              .catch(logger.error);
          }
        })
        .catch((err) => {
          logger.error(err);
          resolve(null)
        });
    } else {
      resolve(null);
    }
  });
}

ChatSession.prototype.add = function(data) {
  let self = this;
  return new Promise((resolve, reject) => {
    if (data) {
      self.dbStore.get(data.uid, data.to_uid)
        .then((dupRecord) => {
          return new Promise((resolve, reject) => {
            if (dupRecord) {
              return reject(new ApiError('duplicated record exists', ErrorCode.CONFLICT));
            } else {
              resolve();
            }
          });
        })
        .then(() => {
          return self.dbStore.create(data);
        })
        .then((chatSession) => {
          resolve(chatSession);
          logger.debug('in add: chatSession: ', chatSession);
          self.cacheStore.setChatSession(chatSession)
            .then(() => {
              return self.cacheStore.addToUserSessionList(chatSession.uid, chatSession);
            })
            .catch(logger.error);
        })
        .catch(reject);
    } else {
      reject(new Error('empty data'));
    }
  });
}

ChatSession.prototype.update = function(data) {
  let self = this;
  return new Promise((resolve, reject) => {
    if (!data) {
      return reject(new Error('empty data'));
    }
    self.dbStore.update(data)
      .then((chatSession) => {
        resolve(chatSession);
        self.cacheStore.setChatSession(chatSession)
          .then(()=>{
            return self.cacheStore.addToUserSessionList(chatSession.uid, chatSession);
          })
          .then(()=>{
            logger.debug('update success!', chatSession);
          })
          .catch(logger.error);
      })
      .catch(reject);
  });
}

ChatSession.prototype.getUserSessionList = function(uid, score, size, offset) {
  let self = this;
  return new Promise((resolve, reject) => {
    if (!uid) {
      return resolve(null);
    }
    self.cacheStore.getUserSessionIdList({
        uid: uid,
        score: score,
        count: size,
        offset: offset
      })
      .then((idList) => {
        logger.debug('idList: ', idList);
        if (Array.isArray(idList) && idList.length > 0) {
          let promises = idList.map(x => self.get({
            uid: x.split('_')[0],
            to_uid: x.split('_')[1],
          }));
          return Promise.all(promises);
        } else {
          return self.dbStore.getListByUid(uid)
            .then((dataList) => {
              logger.debug(dataList);
              resolve(dataList);
              logger.debug('dataList: ', dataList);
              if (Array.isArray(dataList) && dataList.length > 0) {
                let promises = dataList.map(x => self.cacheStore.setChatSession(x));
                promises.push(self.cacheStore.addToUserSessionList(uid, dataList));
                return Promise.all(promises);
              } else {
                return Promise.resolve(null);
              }
            })
        }
      })
      .then(resolve)
      .catch((err) => {
        logger.error(err);
        resolve(null);
      });
  });
}

// DB
function DbStore() {}
util.inherits(DbStore, DB);
ChatSession.prototype.dbStore = new DbStore();

const sqls = {
  create: 'INSERT INTO chat_session (uid, to_uid, unread_cnt, create_time, update_time) VALUES ($1::bigint, $2::bigint, $3::int, $4::date, $5::date)',
  update: 'UPDATE chat_session SET unread_cnt=$3::int, create_time=$4::date, update_time=$5::date WHERE uid=$1::bigint AND to_uid=$2::bigint',
  select: 'SELECT * FROM chat_session WHERE uid=$1::bigint AND to_uid=$2::bigint',
  selectListByUid: 'SELECT * FROM chat_session WHERE uid=$1::bigint ORDER BY update_time DESC',
}

DbStore.prototype.create = function(data) {
  let self = this,
    chatSession = new ChatSession(data),
    args = {
      sql: sqls.create,
      params: [chatSession.uid, chatSession.to_uid, chatSession.unread_cnt, chatSession.create_time, chatSession.update_time]
    };
  return new Promise((resolve, reject) => {
    logger.debug('into create chatSession result');
    self.save(args)
      .then(function(result) {
        logger.debug('create chatSession result: ' + result);
        if (result <= 0) {
          reject(new Error('create chatSession failed'));
        } else {
          resolve(chatSession);
        }
      })
      // .catch(reject);
      .catch((err) => {
        logger.error(err);
        reject(err);
      });
  });
}

DbStore.prototype.update = function(data) {
  let self = this,
    chatSession = new ChatSession(data),
    args = {
      sql: sqls.update,
      params: [chatSession.uid, chatSession.to_uid, chatSession.unread_cnt, chatSession.create_time, chatSession.update_time]
    };
  return new Promise((resolve, reject) => {
    self.save(args)
      .then(function(result) {
        if (result <= 0) {
          reject(new Error('update chatSession failed'));
        } else {
          resolve(chatSession);
        }
      })
      .catch(reject);
  });
}

DbStore.prototype.get = function(uid, to_uid) {
  let self = this,
    args = {
      sql: sqls.select,
      params: [uid, to_uid]
    };
  return new Promise((resolve, reject) => {
    self.select(args)
      .then((res) => {
        resolve(res);
      })
      .catch(reject);
  });
}

DbStore.prototype.getListByUid = function(uid) {
  let self = this,
    args = {
      sql: sqls.selectListByUid,
      params: [uid]
    };
  return new Promise((resolve, reject) => {
    self.selectList(args)
      .then(resolve)
      .catch(reject);
  });
}

// cache
function CacheStore() {}
util.inherits(CacheStore, RedisCache);
ChatSession.prototype.cacheStore = new CacheStore();

const keyPrefixes = require('../common/const.js').cachePrefix.chat;

CacheStore.prototype.getChatSession = function(uid, to_uid) {
  let self = this,
    key = keyPrefixes.chatSession + uid;
  if (to_uid) {
    key += ('_' + to_uid);
  }
  logger.debug(key);
  return self.get({
      key: key
    })
    .then(self.parseObjectResult);
}

CacheStore.prototype.setChatSession = function(data) {
  let self = this;
  return new Promise((resolve, reject) => {
    try {
      let value = JSON.stringify(data),
        key = keyPrefixes.chatSession + data.uid + '_' + data.to_uid;
      logger.debug('in set:', key);
      self.set({
          key: key,
          value: value
        })
        .then(self.parseObjectResult)
        .then(resolve, reject);
    } catch (err) {
      logger.error(err);
      reject(err);
    }
  });
}

CacheStore.prototype.addToUserSessionList = function(uid, data) {
  let self = this;
  return new Promise((resolve, reject) => {
    if (!data || !uid) {
      reject(new Error('empty data'));
    } else {
      if (!Array.isArray(data)) {
        data = [data];
      }
      let key = keyPrefixes.userChatSessions + uid,
        scoreMap = {};
      data.forEach((item) => {
        let score = (item && item.update_time && item.update_time.getTime()),
          member = (item.uid && item.to_uid && (item.uid + '_' + item.to_uid)) || null;
        logger.debug(score, member);
        if (score && member) {
          scoreMap[member] = score;
        }
      });
      self.zadd({
        key: key,
        scoreMap: scoreMap
      }).then(resolve, reject);
    }
  });
}

CacheStore.prototype.getUserSessionIdList = function(args) {
  let self = this;
  return new Promise((resolve, reject) => {
    if (args && args.uid) {
      self.zrangebyscore({
        key: keyPrefixes.userChatSessions + args.uid,
        upper: args.score,
        lower: 0,
        count: args.count,
        offset: args.offset
      }).then(resolve, reject);
    } else {
      reject(new Error('empty args'));
    }
  });
}

module.exports = ChatSession;
// module.exports.dbStore = DbStore; // TODO tmp for test
// module.exports.cacheStore = CacheStore; // TODO tmp for test