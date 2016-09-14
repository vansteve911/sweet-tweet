'use strict';
const ChatSession = require('../models/chatSession'),
  logger = require('../logger');

let uid = 1, to_uid = 2,
  chatSession = new ChatSession({
  uid: uid,
  to_uid: to_uid,
  unread_cnt: 0,
  // create_time: ,
  // update_time: ,
});

// let db = new ChatSession.dbStore();

// db.create(chatSession)
//   .then(logger.debug)
//   .catch(logger.error);

// db.get(uid, to_uid)
//   .then(logger.debug)
//   .catch(logger.error);

// db.getListByUid(uid)
//   .then((res) => {logger.debug(res)})
//   .catch(logger.error);

// chatSession.unread_cnt = 1;

// db.update(chatSession)
//   .then(logger.debug)
//   .catch(logger.error);

// setTimeout(function() {
//   db.getListByUid(uid)
//     .then(logger.debug)
//     .catch(logger.error);
// }, 50);

// let cache = new ChatSession.cacheStore();

// setTimeout(function() {
//   cache.setChatSession(chatSession)
//     .then((res) => {logger.debug(res)})
//     .catch((err) => {logger.error(err)});
//   setTimeout(function() {
//     cache.getChatSession(uid, to_uid)
//       .then((res) => {logger.debug(res)})
//       .catch(logger.error);
//   }, 0);
// }, 0);

// setTimeout(function() {
//   cache.addToUserSessionList(uid, chatSession)
//     .then((res) => {logger.debug(res)})
//     .catch(logger.error);
//   setTimeout(function() {
//     cache.getUserSessionIdList({
//       uid: uid
//     })
//       .then((res) => {logger.debug(res)})
//       .catch(logger.error);
//   }, 0);
// }, 0);

let model = new ChatSession();

// model.get(uid, to_uid)
//   .then((res) => {logger.debug(res)})
//   .catch((err) => {logger.error(err)});

// chatSession.to_uid = 3;
// model.add(chatSession)
//   .then((res) => {logger.debug(res)})
//   .catch((err) => {logger.error(err)});

model.getUserSessionList(uid, (new Date()).getTime())
  .then((res) => {logger.debug(res)})
  .catch((err) => {logger.error(err)});
  



