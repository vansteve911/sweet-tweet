'use strict';
const fs = require('fs'),
	config = require('../config'),
	ApiError = require('../common/apiError'),
	ErrorCode = require('../common/ErrorCode'),
	UserBasic = require('../models/userBasic'),
	hashUtils = require('../utils/hashUtils'),
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
		if (!(typeof account === 'string' && account)) {
			return reject(new ApiError('empty account!', ErrorCode.BAD_REQUEST));
		} else if (!(typeof password === 'string' && password)) {
			return reject(new ApiError('empty password!', ErrorCode.BAD_REQUEST));
		} else if (!(typeof nickname === 'string' && nickname)) {
			return reject(new ApiError('empty nickname!', ErrorCode.BAD_REQUEST));
		}
		self.checkNickname(nickname)
			.then(() => {
				id = genUserID(data);
				if (!id) {
					return reject(new ApiError('genUserID failed!', ErrorCode.BAD_REQUEST));
				}
				data.id = id;
				data.create_time = new Date();
				// encrypt password
				data.password = hashUtils.encryptPassword(password);
				ub.add(data)
					.then(() => {
						resolve(parseToView(data));
					})
					.catch(reject);
			})
			.catch(reject);
	});
}

UserService.prototype.checkNickname = function(nickname) {
	return new Promise((resolve, reject) => {
		if (nickname) {
			ub.getByNickname(nickname)
				.then((res) => {
					if (res) {
						console.log('same name guy:', res)
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
	let self = this;
	return new Promise((resolve, reject) => {
		if (!parseInt(id)) {
			return reject(new ApiError('not exists!', ErrorCode.NOT_FOUND));
		}
		ub.get(id)
			.then((data) => {
				if (data) {
					resolve(parseToView(data));
				} else {
					reject(new ApiError('not exists!', ErrorCode.NOT_FOUND));
				}
			})
			.catch(reject);
	});
}

UserService.prototype.update = function(id, data) {
	let self = this;
	return new Promise((resolve, reject) => {
		if (!data) {
			return reject(new ApiError('empty args!', ErrorCode.BAD_REQUEST));
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
								console.log('check results: ', results);
								ub.update(userBasic)
									.then(resolve)
									.catch(reject);
							})
							.catch(reject);
					}
				} else {
					return reject(new ApiError('not exists!', ErrorCode.NOT_FOUND));
				}
			})
			.catch(reject);
	});
}

function genUserID(user) {
  if (user && user.account) {
    return hashUtils.genID('user/' + user.account);
  }
  return null;
}

function parseToView(model) {
	if (model) {
		delete model.password;
	}
	return model;
}

module.exports = UserService;