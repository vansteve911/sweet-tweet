'use strict';
const DB = require('../storage/db'),
	logger = require('../logger'),
	RedisCache = require('../storage/cache'),
	keyPrefixes = require('../common/const').cachePrefix.user;

const __dbStore__ = Symbol('DbStore'),
	__cacheStore__ = Symbol('CacheStore');

class UserRelation {
	constructor(data) {
		data = data || {};
		this.id = parseInt(data.id) || 0;
		this.uid = parseInt(data.uid) || 0;
		this.target_uid = parseInt(data.target_uid) || 0;
		this.status = parseInt(data.status) || 0; // 0-已向对方发送好友请求，1-与对方互为好友，2-已拉黑对方
		this.create_time = data.create_time || new Date();
		this.update_time = data.update_time || new Date(0);
	}
	add(data) {
		let dbStore = UserRelation[__dbStore__],
			cacheStore = UserRelation[__cacheStore__];
		return new Promise((resolve, reject) => {
				if (!data) {
					return reject(new Error('empty data'));
				}
				dbStore.create(data)
					.then((ur) => {
						logger.debug(ur);
						resolve(ur);
						cacheStore.setUserRelation(ur)
							// .then(cacheStore.addToUidList)
							.then((res) => {
								logger.debug('success add userRelation');
							})
							.catch((err) => {
								logger.error('failed to addToUidList');
								logger.error(err);
							});
					})
			})
			.catch(reject);
	}
	getById (id) {
		let dbStore = UserRelation[__dbStore__],
			cacheStore = UserRelation[__cacheStore__];
		return new Promise((resolve, reject)=>{
			if(id = parseInt(id)){
				cacheStore.getUserRelation(id)
					.then((ur)=>{
						if(ur){
							resolve(ur)
						} else {
							dbStore.getById(id)
								.then((ur)=>{
									resolve(ur);
									cacheStore.setUserRelation(ur)
										.then(()=>{
											logger.debug('success set ur in cache, id: ' + id);
										})
									.catch((err)=>{
										logger.error('failed to get ur by id from cache, id: ' + id, err);
									})
								})
								.catch((err)=>{
									logger.error('failed to get ur by id from db, id: ' + id, err);
								})
						}
					});
			} else {
				reject(new Error('invalid id: ' + id));
			}
		});
	}
	updateStatus(id, status) {
		let dbStore = UserRelation[__dbStore__],
			cacheStore = UserRelation[__cacheStore__];




	}

}
UserRelation[__dbStore__] = new DbStore();
UserRelation[__cacheStore__] = new CacheStore();

const sqls = {
	create: 'INSERT INTO user_relation (id, uid, target_uid, status, create_time, update_time) VALUES ($1::bigint, $2::bigint, $3::bigint, $4::smallint, $5::date, $6::date)',
	update: 'UPDATE user_relation SET uid = $2::bigint, target_uid = $3::bigint, status = $4::smallint, create_time = $5::date, update_time =$6::date WHERE id = $1::bigint',
	select: 'SELECT * FROM user_relation WHERE id=$1::bigint',
	selectListByUid: 'SELECT * FROM user_relation WHERE uid = $1::bigint ORDER BY update_time DESC LIMIT $2::int',
	selectListByTargetUid: 'SELECT * FROM user_relation WHERE target_uid = $1::bigint ORDER BY update_time DESC LIMIT $2::int'
}

class DbStore extends DB {
	create(data) {
		let self = this,
			ur = new UserRelation(data),
			args = {
				sql: sqls.create,
				params: [ur.id, ur.uid, ur.target_uid, ur.status, ur.create_time, ur.update_time]
			}
		return new Promise((resolve, reject) => {
			self.save(args)
				.then(function(result) {
					if (result <= 0) {
						reject(new Error('create failed'));
					} else {
						logger.debug('create success: ', ur);
					}
				})
				.catch(reject);
		});
	}
	update(data) {
		let self = this,
			ur = new UserRelation(data),
			args = {
				sql: sqls.update,
				params: [ur.id, ur.uid, ur.target_uid, ur.status, ur.create_time, ur.update_time]
			}
		return new Promise((resolve, reject) => {
			self.save(args)
				.then((result) => {
					if (result <= 0) {
						reject(new Error('update failed'));
					} else {
						logger.debug('update success: ', ur);
					}
				})
				.catch(reject);
		});
	}
	getById(id) {
		let self = this,
			args = {
				sql: sqls.select,
				params: [id]
			};
		return self.select(args);
	}
	getListByUid(uid, size) {
		let self = this,
			args = {
				sql: sqls.selectListByUid,
				params: [uid, size]
			}
		return self.selectList(args);
	}
	getListByTargetUid(target_uid, size) {
		let self = this,
			args = {
				sql: sqls.selectListByTargetUid,
				params: [target_uid, size]
			}
		return self.selectList(args);
	}
}

class CacheStore extends RedisCache {
	getUserRelation(id) {
		let self = this;
		return self.get({
				key: keyPrefixes.userRelation + id
			})
			.then(self.parseObjectResult);
	}
	setUserRelation(data) {
		let self = this;
		return new Promise((resolve, reject) => {
			try {
				let value = JSON.stringify(data);
				self.set({
						key: keyPrefixes.userRelation + id,
						value: value
					})
					.then(self.parseObjectResult)
					.then(resolve, reject);
			} catch (err) {
				reject(err);
			}
		})
	}
	addToUidList(data) {
		let self = this,
			uid,
			status;
		return new Promise((resolve, reject) => {
			if (!data || !(uid = data.uid) || !(status = data.status)) {
				reject(new Error('empty args'));
			} else {
				let key = keyPrefixes.userRelationListByUid + uid + '_' + status;
				self.genZsetArgs(key, data, 'id', 'update_time')
					.then(self.zadd)
					.then(resolve, reject);
			}
		});
	}
	delInUidList(data) {
		let self = this,
			uid,
			status;
		return new Promise((resolve, reject) => {
			if (!data || !(uid = data.uid) || !(status = data.status)) {
				reject(new Error('empty args'));
			} else {
				let key = keyPrefixes.userRelationListByUid + uid + '_' + status;
				return self.genZsetArgs(key, data, 'id')
					.then(self.zrem)
					.then(resolve, reject);
			}
		});
	}
}
// module.export = UserRelation;