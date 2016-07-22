// 'use strict';
// const fs = require('fs'),
// 	util = require('util'),
// 	DB = require('../storage/db'),
// 	RedisCache = require('../storage/cache'),
// 	config = require('../config'),
// 	ApiError = require('../common/apiError'),
// 	ErrorCode = require('../common/errorCode');

// function User(data) {
// 	data = data || {};
// 	this.id = parseInt(data.id) || 0;
// 	this.account = data.account || 'nobody';
// 	this.password = data.password || '';
// 	this.nickname = data.nickname || '匿名用户';
// 	this.avatar = data.nickname || '';
// 	this.type = parseInt(data.type) || 0;
// 	this.status = parseInt(data.status) || 0;
// 	this.create_time = _parseDate(data.create_time);
// 	this.remark = data.remark || '';
// }

// function _parseDate(date) {
// 	if (date instanceof Date) {
// 		return date;
// 	} else if (typeof date === 'string') {
// 		let res;
// 		try {
// 			res = new Date()
// 		} catch (err) {
// 			logger.error(err);
// 			res = new Date();
// 		}
// 		return res;
// 	}
// 	return new Date();
// }


// User.prototype.add = function(data) {
// 	let self = this;
// 	return new Promise((resolve, reject) => {
// 			if (data) {
// 				self.dbStore.create(data)
// 					.then((user) => {
// 							resolve(user);
// 							self.cacheStore.setUser(user)
// 								.then((res) => {
// 									logger.debug('add user success!', user);
// 								})
// 								.catch((err) => {
// 									logger.error('failed to add user', err.stack);
// 								});
// 						}
// 					})
// 			.catch(reject);
// 		} else {
// 			reject(new Error('empty data'));
// 		}
// 	});
// }

// User.prototype.get = function(id) {
// 	let self = this;
// 	return new Promise((resolve, reject) => {
// 		if (id = parseInt(id)) {
// 			self.cacheStore.getUser(id)
// 				.then((user) => {
// 					if (user) {
// 						resolve(user);
// 					} else {
// 						self.dbStore.get(id)
// 							.then((user) => {
// 								resolve(user);
// 								if (user) {
// 									self.cacheStore.setUser(user)
// 										.then((res) => {
// 											logger.debug('add user to cache success!', user);
// 										})
// 										.catch((err) => {
// 											logger.error('' + err, err.stack);
// 										});
// 								}
// 							});
// 					}
// 				})
// 				.catch(reject);
// 		} else {
// 			reject(new Error('invalid id: ' + id));
// 		}
// 	});
// }

// // Cache
// function CacheStore() {}
// util.inherits(DbStore, DB);
// User.prototype.cacheStore = new CacheStore();

// CacheStore.prototype.keyPrefixes = require('../common/const.js').cachePrefix.user;

// CacheStore.prototype.getUser = function(id) {
// 	let self = this;
// 	return self.get({
// 			key: self.keyPrefixes.user + id
// 		})
// 		.then(self.parseObjectResult);
// }

// CacheStore.prototype.setUser = function(data) {
// 	let self = this;
// 	return new Promise((resolve, reject) => {
// 		try {
// 			let value = JSON.stringify(data);
// 			self.set({
// 					key: self.keyPrefixes.user + data.id,
// 					value: value
// 				})
// 				.then(self.parseObjectResult)
// 				.then(resolve, reject);
// 		} catch (err) {
// 			reject(err);
// 		}
// 	});
// }



// // DB
// function DbStore() {}
// util.inherits(DbStore, DB);
// User.prototype.dbStore = new DbStore();

// DbStore.prototype.sqls = {
// 	create: 'INSERT INTO user (id, type, status, account, password, nickname, avatar, create_time, remark) VALUES ($1::bigint,  $2::smallint, $3::smallint, $4::text, $5::text, $6::text, $7::text, $8::date, $9::text)',
// 	update: 'UPDATE user SET type = $2::smallint, status, account, password, nickname, avatar, create_time, remark) VALUES ($1::bigint, type=$2::smallint, status=$3::smallint, account=$4::text, password=$5::text, nickname=$6::text, avatar=$7::text, date=$8::date, remark=$9::text WHERE id=$1::bigint',
// 	select: 'SELECT * FROM user WHERE id=$1::bigint',
// 	// selectMany: 
// }

// DbStore.prototype.create = function(data) {
// 	let self = this,
// 		user = new User(data),
// 		args = {
// 			sql: self.sqls.create,
// 			params: [user.id, user.type, user.status, user.account, user.password, user.nickname, user.avatar, user.create_time, user.remark]
// 		};
// 	return new Promise((resolve, reject) => {
// 		self.save(args).then(function(result) {
// 			logger.debug('create user result: ' + result);
// 			if (result <= 0) {
// 				reject(new Error('create user failed'));
// 			} else {
// 				resolve(tweet);
// 			}
// 		});
// 	});
// }

// DbStore.prototype.update = function(data) {
// 	let self = this,
// 		user = new User(data),
// 		args = {
// 			sql: self.sqls.update,
// 			params: [user.id, user.type, user.status, user.account, user.password, user.nickname, user.avatar, user.create_time, user.remark]
// 		};
// 	return new Promise((resolve, reject) => {
// 		self.save(args).then(function(result) {
// 			logger.debug('update user result: ' + result);
// 			if (result <= 0) {
// 				reject(new Error('update user failed'));
// 			} else {
// 				resolve(tweet);
// 			}
// 		});
// 	});
// }

// DbStore.prototype.get = function(id) {
// 	let self = this,
// 		args = {
// 			sql: self.sqls.select,
// 			params: [id]
// 		};
// 	return self.select(args);
// }