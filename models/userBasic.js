'use strict';
const util = require('util'),
	DB = require('../storage/db'),
	RedisCache = require('../storage/cache'),
	config = require('../config'),
  logger = require('../logger'),
	ApiError = require('../common/apiError'),
	ErrorCode = require('../common/errorCode');

function UserBasic(data) {
	data = data || {};
	this.id = parseInt(data.id) || 0;
	this.account = data.account || 'nobody';
	this.password = data.password || '';
	this.nickname = data.nickname || '匿名用户';
	this.avatar = data.avatar || '';
	this.type = parseInt(data.type) || 0;
	this.status = parseInt(data.status) || 0;
	this.create_time = _parseDate(data.create_time);
	this.remark = data.remark || '';
}

function _parseDate(date) {
	if (date instanceof Date) {
		return date;
	} else if (typeof date === 'string') {
		let res;
		try {
			res = new Date()
		} catch (err) {
			logger.error(err);
			res = new Date();
		}
		return res;
	}
	return new Date();
}

UserBasic.prototype.add = function(data) {
	let self = this;
	return new Promise((resolve, reject) => {
		if (data) {
			self.dbStore.create(data)
				.then((user) => {
					logger.debug('user:', user);
					resolve(user);
					self.cacheStore.setUser(user)
						.then((res) => {
							logger.debug('add user success!', user);
						})
						.catch((err) => {
							logger.error('failed to add user basic', err.stack);
						});
				})
				.catch(reject);
		} else {
			reject(new Error('empty data'));
		}
	});
}

UserBasic.prototype.update = function(data) {
	let self = this;
	return new Promise((resolve, reject) => {
		if (data) {
			self.dbStore
				.update(data)
				.then((user) => {
					resolve(user);
					self.cacheStore.setUser(user)
						.then((res) => {
							logger.debug('update user success!', user);
						})
						.catch((err) => {
							logger.error('failed to update user basic', err.stack);
						});
				})
				.catch(reject);
		} else {
			reject(new Error('empty data'));
		}
	});
}

UserBasic.prototype.get = function(id) {
	let self = this;
	return new Promise((resolve, reject) => {
		if (id = parseInt(id)) {
			self.cacheStore.getUser(id)
				.then((user) => {
					if (user) {
						resolve(user);
					} else {
						self.dbStore.get(id)
							.then((user) => {
								resolve(user);
								if (user) {
									self.cacheStore.setUser(user)
										.then((res) => {
											logger.debug('add user basic to cache success!', user);
										})
										.catch((err) => {
											logger.error('' + err, err.stack);
										});
								}
							});
					}
				})
				.catch(reject);
		} else {
			reject(new Error('invalid id: ' + id));
		}
	});
}

UserBasic.prototype.authenticate = function(id, password) {
  let self = this;
  return new Promise((resolve, reject)=>{
    if (id = parseInt(id)) {
      self.dbStore.get(id, true)
        .then((user)=>{
          if(user && user.password === password){
            delete user.password;
            resolve(user);
          } else {
            reject();
          }
        })
        .catch(reject);
    }else {
      reject(new Error('invalid id: ' + id));
    }
  });
}

UserBasic.prototype.getByNickname = function(nickname) {
	let self = this;
	return new Promise((resolve, reject) => {
		if (nickname && typeof nickname === 'string') {
			self.dbStore.getByNickname(nickname)
				.then(resolve)
				.catch(reject);
		} else {
			reject(new Error('invalid nickname: ' + nickname));
		}
	});
}


/**
 * user cache store
 */
function CacheStore() {}
util.inherits(CacheStore, RedisCache);
UserBasic.prototype.cacheStore = new CacheStore();

CacheStore.prototype.keyPrefixes = require('../common/const.js').cachePrefix.user;

CacheStore.prototype.getUser = function(id) {
	let self = this;
	return self.get({
			key: self.keyPrefixes.user + id
		})
		.then(self.parseObjectResult);
}

CacheStore.prototype.setUser = function(data) {
	let self = this;
	return new Promise((resolve, reject) => {
		try {
			let value = JSON.stringify(data);
			self.set({
					key: self.keyPrefixes.user + data.id,
					value: value
				})
				.then(self.parseObjectResult)
				.then(resolve, reject);
		} catch (err) {
			reject(err);
		}
	});
}

// DB
function DbStore() {}
util.inherits(DbStore, DB);
UserBasic.prototype.dbStore = new DbStore();

DbStore.prototype.sqls = {
	create: 'INSERT INTO user_basic (id, type, status, account, password, nickname, avatar, create_time, remark) VALUES ($1::bigint,  $2::smallint, $3::smallint, $4::text, $5::text, $6::text, $7::text, $8::date, $9::text)',
	update: 'UPDATE user_basic SET type=$2::smallint, status=$3::smallint, account=$4::text, password=$5::text, nickname=$6::text, avatar=$7::text, create_time=$8::date, remark=$9::text WHERE id=$1::bigint',
	select: 'SELECT * FROM user_basic WHERE id=$1::bigint',
	selectByNickname: 'SELECT * FROM user_basic WHERE nickname=$1::text'
}

DbStore.prototype.create = function(data) {
	let self = this,
		user = new UserBasic(data),
		args = {
			sql: self.sqls.create,
			params: [user.id, user.type, user.status, user.account, user.password, user.nickname, user.avatar, user.create_time, user.remark]
		};
	return new Promise((resolve, reject) => {
		self.save(args)
			.then(function(result) {
				logger.debug('create user result: ' + result);
				if (result <= 0) {
					reject(new Error('create user failed'));
				} else {
					resolve(removeHiddenFields(user));
				}
			})
			.catch(reject);
	});
}

DbStore.prototype.update = function(data) {
	let self = this,
		user = new UserBasic(data),
		args = {
			sql: self.sqls.update,
			params: [user.id, user.type, user.status, user.account, user.password, user.nickname, user.avatar, user.create_time, user.remark]
		};
	return new Promise((resolve, reject) => {
		self.save(args)
			.then(function(result) {
				if (result <= 0) {
					reject(new Error('update user failed'));
				} else {
					logger.debug('after update user: ', user);
					resolve(removeHiddenFields(user));
				}
			})
			.catch(reject);
	});
}

DbStore.prototype.get = function(id, withPassword) {
	let self = this,
		args = {
			sql: self.sqls.select,
			params: [id]
		};
	return new Promise((resolve, reject) => {
		self.select(args)
			.then((res) => {
      resolve(removeHiddenFields(res, !withPassword));
			})
			.catch(reject);
	});
}

DbStore.prototype.getByNickname = function(nickname) {
	let self = this,
		args = {
			sql: self.sqls.selectByNickname,
			params: [nickname]
		};
	return new Promise((resolve, reject) => {
		self.select(args)
			.then((res) => {
				resolve(removeHiddenFields(res));
			})
			.catch(reject);
	});
}

function removeHiddenFields(data, removePassword) {
	if (data) {
		delete data._id;
    if(removePassword){
      delete data.password;
    }
	}
	return data;
}

module.exports = UserBasic;