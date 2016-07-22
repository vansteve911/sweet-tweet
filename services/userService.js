'use strict';
const fs = require('fs'),
	config = require('../config'),
	ApiError = require('../common/apiError'),
	ErrorCode = require('../common/ErrorCode'),
	UserBasic = require('../models/userBasic'),
	cryptUtils = require('../utils/cryptUtils'),
	ub = new UserBasic();

function UserService() {}

UserService.prototype.create = function(data) {
	let self = this;
	return new Promise((resolve, reject) => {
		if (!data) {
			return reject(new ApiError('empty args!', ErrorCode.BAD_REQUEST));
		}
		let id, account = data.account,
			password = data.password,
			nickname = data.nickname;
		if (!isValidAccount(account)) {
			// account must be email
			return reject(new ApiError('empty account!', ErrorCode.BAD_REQUEST));
		} else if (!(typeof password === 'string' && password)) {
			return reject(new ApiError('empty password!', ErrorCode.BAD_REQUEST));
		} else if (!(typeof nickname === 'string' && nickname)) {
			return reject(new ApiError('empty nickname!', ErrorCode.BAD_REQUEST));
		}
		self.checkNickname(nickname)
			.then(() => {
				id = genUserID(account);
				if (!id) {
					return reject(new ApiError('genUserID failed!', ErrorCode.BAD_REQUEST));
				}
				data.id = id;
				data.create_time = new Date();
				// encrypt password
				data.password = cryptUtils.encryptPassword(password);
				ub.add(data)
					.then(() => {
						resolve(parseToView(data));
					})
					.catch(reject);
			})
			.catch(reject);
	});
}

UserService.prototype.authenticate = function(account, password) {
	let error = new ApiError('wrong account or password', ErrorCode.UNAUTHORIZED);
	return new Promise((resolve, reject) => {
		if (isValidAccount(account) && password) {
			ub.authenticate(genUserID(account), cryptUtils.encryptPassword(password))
				.then((userBasic) => {
					resolve(userBasic);
				})
				.catch(() => {
					reject(error);
				});
		} else {
			reject(error);
		}
	});
}

UserService.prototype.checkNickname = function(nickname) {
	return new Promise((resolve, reject) => {
		if (nickname) {
			ub.getByNickname(nickname)
				.then((res) => {
					if (res) {
						return reject(new ApiError('your nickname is duplicated with user ' + res.id, ErrorCode.CONFLICT));
					} else {
						resolve(true);
					}
				})
				.catch(reject);
		} else {
			return reject(new ApiError('empty nickname!', ErrorCode.BAD_REQUEST));
		}
	});
}

UserService.prototype.checkAvatar = function(avatar) {
	return new Promise((resolve, reject) => {
		if (avatar) {
			resolve(true);
		} else {
			reject(new ApiError('invalid avatar: ' + avatar, ErrorCode.BAD_REQUEST));
		}
	});
}

UserService.prototype.checkRemark = function(remark) {
	return new Promise((resolve, reject) => {
		if (remark) {
			resolve(true);
		} else {
			reject(new ApiError('invalid remark: ' + remark, ErrorCode.BAD_REQUEST));
		}
	});
}

UserService.prototype.get = function(id) {
	let self = this,
		error = new ApiError('user not exists!', ErrorCode.NOT_FOUND);
	return new Promise((resolve, reject) => {
		if (!parseInt(id)) {
			return reject(error);
		}
		ub.get(id)
			.then((data) => {
				if (data) {
					resolve(parseToView(data));
				} else {
					reject(error);
				}
			})
			.catch(reject);
	});
}

UserService.prototype.update = function(id, data) {
	let self = this,
		error = new ApiError('user not exists!', ErrorCode.NOT_FOUND);
	return new Promise((resolve, reject) => {
		if (!data) {
			return reject(error);
		}
		ub.get(id)
			.then((userBasic) => {
				if (userBasic) {
					let checkPromises = [];
					if (data.nickname && data.nickname !== userBasic.nickname) {
						userBasic.nickname = data.nickname;
						checkPromises.push(self.checkNickname(data.nickname));
					}
					if (data.avatar && data.avatar !== userBasic.avatar) {
						userBasic.avatar = data.avatar;
						checkPromises.push(self.checkAvatar(data.avatar));
					}
					if (data.remark && data.remark !== userBasic.remark) {
						userBasic.remark = data.remark;
						checkPromises.push(self.checkRemark(data.remark));
					}
					if (checkPromises) {
						Promise.all(checkPromises)
							.then((results) => {
								ub.update(userBasic)
									.then(resolve)
									.catch(reject);
							})
							.catch(reject);
					}
				} else {
					return reject(error);
				}
			})
			.catch(new ApiError('update failed', ErrorCode.FAILED));
	});
}

function genUserID(account) {
	if (account) {
		return cryptUtils.genID('user/' + account);
	}
	return null;
}

function isValidAccount(account) {
	return /^[\w\-_]+@([\w\-_]+\.)+\w+$/.test(account);
}

function parseToView(model) {
	if (model) {
		delete model.password;
	}
	return model;
}

module.exports = new UserService();