'use strict';
const fs = require('fs'),
	config = require('../config'),
	ApiError = require('../common/apiError'),
	ErrorCode = require('../common/ErrorCode'),
	logger = require('../logger'),
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
			logger.debug('before acquire session: ');

			cs.get(param)
				.then((data) => {
					logger.debug('after acquire session: ', data);
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

function getUser(uid) {
	let err = new ApiError(ErrorCode.NOT_FOUND, 'user not exists!');
	return new Promise((resolve, reject) => {
		if (!uid) {
			return reject(err);
		}
		userService.get(uid)
			.then((user) => {
				if (!user) {
					return reject(err);
				}
				logger.debug('getUser: ', user);
				resolve(user);
			})
			.catch(reject);
	})
}

function createSession(data) {
	return new Promise((resolve, reject) => {
		if (!data) {
			return reject(new ApiError('empty args!', ErrorCode.BAD_REQUEST));
		}
		Promise.all([getUser(data.uid), getUser(data.to_uid)])
			.then((list) => {
        logger.debug('createSession get users: ', list);
				cs.add(data)
					.then(resolve)
					.catch(reject);
			})
			.catch(reject);
	});
}

ChatSessionService.prototype.updateUnreadCnt = function(uid, to_uid, unreadCnt) {
	let self = this;
	return new Promise((resolve, reject) => {
		unreadCnt = parseInt(unreadCnt);
		if (!uid || !to_uid || !(unreadCnt >= 0)) {
			return reject(new ApiError('illegal param', ErrorCode.BAD_REQUEST));
		}
		self.acquireSession(uid, to_uid)
			.then((data) => {
				if (!data) {
					return reject(new ApiError('not found', ErrorCode.NOT_FOUND));
				}
				data.unread_cnt = unreadCnt;
				data.update_time = new Date();
        logger.debug('test!!', data);
				return cs.update(data);
			})
      .then(resolve)
			.catch(reject);
	})
}

ChatSessionService.prototype.getRawChatSessions = function(uid, score, size, offset) {
	score = score || (new Date()).getTime();
	offset = offset || 0;
	return new Promise((resolve, reject) => {
		if (size <= 0 || offset < 0) {
			return resolve(null);
		}
		cs.getUserSessionList(uid, score, size, offset)
			.then(resolve)
			.catch((err) => {
				logger.error('failed to getUserSessions', err)
				resolve();
			})
	});
}

ChatSessionService.prototype.getUserSessions = function(uid, score, size, offset) {
	let self = this;
	return new Promise((resolve, reject) => {
		self.getRawChatSessions(uid, score, size, offset)
			.then((list) => {
				if (list && Array.isArray(list)) {
					let promises = list.map((session) => {
						getUser(session.to_uid)
					});
					Promise.all(promises)
						.then((users) => {
							logger.debug('get session to users: ', users);
							let i = 0;
							list.forEach((session) => {
								logger.debug('get session to user: ', users[i]);
								session.toSser = users[i++];
							})
							resolve(list);
						})
						.catch(reject);
				} else {
					resolve([]);
				}
			})
			.catch(reject)
	});
}

module.exports = new ChatSessionService();