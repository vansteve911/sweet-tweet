'use strict';
const util = require('util'),
  logger = require('../logger'),
	DB = require('../storage/db'),
	RedisCache = require('../storage/cache'),
	cryptUtils = require('../utils/cryptUtils.js');

function Tweet(data) {
	data = data || {};
	this.id = parseInt(data.id) || 0;
	this.type = parseInt(data.type) || 0; // 0-纯文字，1-带图，2-带视频
	this.status = parseInt(data.type) || 0; // 0-正常，1-隐藏，2-删除
	this.content = data.content || '';
	this.user_id = parseInt(data.user_id) || 0;
	this.time = data.time || new Date();
	this.config = data.config || {};
}

Tweet.prototype.get = function(id) {
	let self = this;
	return new Promise((resolve, reject) => {
		if (id = parseInt(id)) {
			self.cacheStore.getTweet(id)
				.then((tweet) => {
					if (tweet) {
						resolve(tweet);
					} else {
						// get from db
						self.dbStore.getTweet(id)
							.then((tweet) => {
								resolve(tweet);
								if (tweet) {
									self.cacheStore.setTweet(tweet)
										.then().catch((err) => {
											logger.error('' + err, err.stack);
										});
								} else {
									// add empty item to cache
								}
							})
							.catch(reject);
					}
				})
				.catch(reject);
		} else {
			reject(new Error('invalid id: ' + id));
		}
	});
}

Tweet.prototype.add = function(data) {
	let self = this;
	return new Promise((resolve, reject) => {
		if (data) {
			self.dbStore.create(data)
				.then((tweet) => {
					resolve(tweet);
					Promise.all([self.cacheStore.setTweet(tweet), self.cacheStore.addToTweetIdList(tweet)])
						.then((res) => {
							console.log('add to cache success: ', tweet);
						})
						.catch(logger.error);
				})
				.catch(reject);
		} else {
			reject(new Error('empty data'));
		}
	});
}

Tweet.prototype.getList = function(score, count) {
	let self = this;
	return new Promise((resolve, reject) => {
		if ((score = parseFloat(score)) && (count = parseInt(count)) && count > 0) {
			self.cacheStore.getTweetIdList({
					score: score,
					count: count
				})
				.then((idList) => {
					if (Array.isArray(idList) && idList.length > 0) {
						let promises = idList.map(id => self.get(id));
						Promise.all(promises)
							.then(resolve)
							.catch(reject);
					} else {
						// get from db
						self.dbStore.getTweetList(new Date(score), count, 0)
							.then((tweets) => {
								if (tweets) {
									resolve(tweets);
									let promises = tweets.map(tweet =>
										self.add(tweet)
									);
									Promise.all(promises)
										.then((res) => {
											console.log('add tweet ids success');
										}, (err) => {
											logger.error();
										});
								}
							})
							.catch(reject);
					}
				})
				.catch(reject);
		} else {
			resolve(null);
		}
	});
}

/*****/

function CacheStore() {}
util.inherits(CacheStore, RedisCache);
Tweet.prototype.cacheStore = new CacheStore();

CacheStore.prototype.keyPrefixes = require('../common/const.js').cachePrefix.tweet;

CacheStore.prototype.getTweet = function(id) {
	let self = this;
	return self.get({
			key: self.keyPrefixes.tweet + id
		})
		.then(self.parseObjectResult);
}

CacheStore.prototype.setTweet = function(data) {
	let self = this;
	return new Promise(function(resolve, reject) {
		try {
			let value = JSON.stringify(data);
			self.set({
					key: self.keyPrefixes.tweet + data.id,
					value: value
				})
				.then(self.parseObjectResult)
				.then(resolve, reject);
		} catch (err) {
			reject(err);
		}
	});
}

CacheStore.prototype.addToTweetIdList = function(data) {
	let self = this;
	return new Promise((resolve, reject) => {
		if (!data) {
			reject(new Error('empty data'));
		} else {
			if (!Array.isArray(data)) {
				data = [data];
			}
			let key = self.keyPrefixes.tweetIdList,
				scoreMap = {};
			data.forEach((item) => {
				let score = (item && item.time && item.time.getTime()),
					member = item.id;
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

CacheStore.prototype.getTweetIdList = function(args) {
	let self = this,
		key = self.keyPrefixes.tweetIdList,
		score, offset, count;
	return new Promise((resolve, reject) => {
		if (args) {
			self.zrangebyscore({
				key: key,
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

/*================*/
function DbStore() {}
util.inherits(DbStore, DB);
Tweet.prototype.dbStore = new DbStore();

DbStore.prototype.sqls = {
	create: 'INSERT INTO tweet (id, type, status, user_id, create_time, content, config) VALUES($1::bigint, $2::smallint, $3::smallint, $4::bigint, $5::date, $6::text, $7::text)',
	update: 'UPDATE tweet SET type = $2::smallint, status = $3::smallint, user_id = $4::bigint, create_time = $5::date, content = $6::text, config = $7::text WHERE id = $1::bigint',
	select: 'SELECT * FROM tweet WHERE id = $1::bigint',
	selectByTime: 'SELECT * FROM tweet WHERE create_time < $1::date ORDER BY create_time DESC LIMIT $2::int OFFSET $3::bigint'
};

DbStore.prototype.create = function(data) {
	let tweet = new Tweet(data);
	let self = this,
		args = {
			sql: self.sqls.create,
			params: [tweet.id, tweet.type, tweet.status, tweet.user_id, tweet.create_time, tweet.content, tweet.config]
		};
	return new Promise(function(resolve, reject) {
		return self.save(args).then(function(result) {
			if (result <= 0) {
				reject(new Error('create failed'));
			} else {
				resolve(tweet);
			}
		});
	});
}

DbStore.prototype.update = function(data) {
	let tweet = new Tweet(data);
	let self = this,
		args = {
			sql: self.sqls.update,
			params: [tweet.id, tweet.type, tweet.status, tweet.user_id, tweet.create_time, tweet.content, tweet.config]
		};
	return new Promise(function(resolve, reject) {
		self.save(args)
			.then(function(result) {
				console.log('update result: ' + result);
				if (result <= 0) {
					reject(new Error('update failed'));
				} else {
					resolve(tweet);
				}
			});
	});
}


DbStore.prototype.getTweet = function(id) {
	let self = this,
		args = {
			sql: self.sqls.select,
			params: [id]
		};
	return self.select(args);
};
DbStore.prototype.getTweetList = function(time, limit, offset) {
	let self = this,
		args = {
			sql: self.sqls.selectByTime,
			params: [time || new Date(), (!limit || limit < 0) ? 0 : limit, (!offset || offset < 0) ? 0 : offset]
		};
	return self.selectList(args);
};

module.exports = Tweet;
module.exports.dbStore = DbStore; // TODO tmp