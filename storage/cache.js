'use strict';
const redis = require('redis'),
	logger = require('../logger'),
	config = require('../config');
// TODO

function RedisCache() {}

RedisCache.prototype.activateClient = function() {
	let self = this;
	return new Promise((resolve, reject) => {
		try {
			let client = redis.createClient(config.redis);
			client.on('error', function(err) {
				logger.error('redis client error!', err.stack);
			});
			client.on('end', function() {
				logger.debug('redis client quit');
			});
			resolve(client);
		} catch (err) {
			reject(err);
		}
	})
}

RedisCache.prototype.get = function(args) {
	let self = this,
		key;
	return new Promise((resolve, reject) => {
		if (args && (key = args.key)) {
			self.activateClient().then((client) => {
				client.get(key, function(err, res) {
					if (err) {
						logger.error('failed to get key: ' + key, err.message, err.stack);
						reject(err);
					} else {
						resolve(res);
					}
					client.quit();
				}).catch((err) => {
					reject(err);
				});
			})
		} else {
			reject(new Error('empty args' + args));
		}
	});
}

RedisCache.prototype.set = function(args) {
	let self = this,
		key, value;
	return new Promise(function(resolve, reject) {
		if (args && (key = args.key) && (value = args.value)) {
			self.activateClient()
				.then((client) => {
					client.set(key, value, (err, res) => {
						if (err) {
							logger.error('failed to set, key: ' + key + ', value: ' + value, err.message, err.stack);
							reject(err);
						} else {
							resolve(res === 'OK');
						}
					});
					client.quit();
				}).catch((err) => {
					reject(err);
				});
		} else {
			reject(new Error('empty args' + args));
		}
	});
}

RedisCache.prototype.del = function(args) {
	let self = this,
		key;
	return new Promise(function(resolve, reject) {
		if (args && (key = args.key)) {
			self.activateClient().then((client) => {
				client.del(key, (err, res) => {
					if (err) {
						logger.error('failed to del, key: ' + key, err.message, err.stack);
						reject(err);
					} else {
						resolve(res);
					}
				});
				client.quit();
			}).catch((err) => {
				reject(err);
			});
		} else {
			reject(new Error('empty args' + args));
		}
	});
}

RedisCache.prototype.expire = function(args) {
	let self = this,
		key, seconds;
	return new Promise(function(resolve, reject) {
		if (args && (key = args.key) && (seconds = parseInt(seconds))) {
			self.activateClient().then((client) => {
				client.expire(key, seconds, (err, res) => {
					if (err) {
						logger.error('failed to expire, key: ' + key + ', seconds: ' + seconds, err.message, err.stack);
						reject(err);
					} else {
						resolve(res);
					}
				});
				client.quit();
			}).catch((err) => {
				reject(err);
			});
		} else {
			reject(new Error('empty args' + args));
		}
	});
}

RedisCache.prototype.hmset = function(args) {
	let self = this,
		key, map;
	return new Promise((resolve, reject) => {
		if (args && (key = args.key) && (map = args.map)) {
			let params = [];
			for (let k of Object.keys(map)) {
				params.push(k, map[k]);
			}
			self.activateClient().then((client) => {
				client.hmset(key, params, (err, res) => {
					if (err) {
						logger.error('failed to hmset, key: ' + key + ', map: ' + map, err.message, err.stack);
						reject(err);
					} else {
						resolve(res === 'OK');
					}
				});
				client.quit();
			}).catch((err) => {
				reject(err);
			});
		} else {
			reject(new Error('empty args' + args));
		}
	});
}

RedisCache.prototype.hgetall = function(args) {
	let self = this,
		key;
	return new Promise((resolve, reject) => {
		if (args && (key = args.key)) {
			self.activateClient().then((client) => {
				client.hgetall(key, (err, res) => {
					if (err) {
						logger.error('failed to hgetall, key: ' + key, err.message, err.stack);
						reject(err);
					} else {
						resolve(res);
					}
				});
				client.quit();
			});
		} else {
			reject(new Error('empty args' + args));
		}
	});
}

RedisCache.prototype.zadd = function(args) {
	let self = this,
		key, scoreMap;
	return new Promise((resolve, reject) => {
		if (args && (key = args.key) && (scoreMap = args.scoreMap)) {
			self.activateClient().then((client) => {
					let params = [];
					for (let member of Object.keys(scoreMap)) {
						let score = parseFloat(scoreMap[member]);
						if (!score) {
							let err = new Error('failed to parse float score: ' + scoreMap.member);
							logger.error(err);
							reject(err);
							return;
						}
						params.push(score, member); // score member
					}
					if (!params.length) {
						return reject(new Error('empty zadd params'));
					}
					client.zadd(key, params, function(err, res) {
						if (err) {
							logger.error('failed to zadd, key: ' + key + ', scoreMap: ', scoreMap, err.message, err.stack);
							reject(err);
						} else {
							resolve(res);
						}
					});
					client.quit();
				})
				.catch((err) => {
					reject(err);
				});
		} else {
			reject(new Error('empty args' + args));
		}
	});
}

RedisCache.prototype.zrangebyscore = function(args) {
	let self = this,
		key, lower, upper, count, offset, rev;
	return new Promise((resolve, reject) => {
		if (args && (key = args.key)) {
			lower = args.lower || Number.MIN_SAFE_INTEGER;
			upper = args.upper || Number.MAX_SAFE_INTEGER;
			count = parseInt(args.count);
			offset = parseInt(args.offset) || 0;
			rev = args.rev || true;
			let params = [];
			if (rev) {
				params.push(upper, lower);
			} else {
				params.push(lower, upper);
			}
			if (count) {
				params.push('LIMIT', offset, count);
			}
			let callback = (err, res) => {
				if (err) {
					logger.error('failed to zrangebyscore, key: ' + key + ', params: ' + params, err.message, err.stack);
					reject(err);
				} else {
					resolve(res);
				}
			}
			self.activateClient().then((client) => {
				if (rev) {
					client.zrevrangebyscore(key, params, callback);
				} else {
					client.zrangebyscore(key, params, callback);
				}
				client.quit();
			});
		} else {
			reject(new Error('empty args' + args));
		}
	});
}

RedisCache.prototype.zrem = function(args) {
	let self = this,
		key,
		members;
	return new Promise((resolve, reject) => {
		if (args && (key = args.key) && (members = args.members)) {
			self.activateClient().then((client) => {
				client.zrem(key, members, (err, res) => {
					if (err) {
						logger.error('failed to zrem, key: ' + key + ', member: ' + member, err.message, err.stack);
						reject(err);
					} else {
						resolve(res);
					}
				});
				client.quit();
			});
		} else {
			reject(new Error('empty args' + args));
		}
	});
}

RedisCache.prototype.lpush = function(args) {
	let self = this,
		key, value;
	return new Promise((resolve, reject) => {
		if (args && (key = args.key) && (value = args.value)) {
			self.activateClient()
				.then((client) => {
					client.lpush(key, value, (err, res) => {
						if (err) {
							logger.error('failed to lpush, key: ' + key + ', value: ' + value, err.message, err.stack);
							reject(err);
						} else {
							resolve(res);
						}
					});
					client.quit();
				});
		} else {
			reject(new Error('empty args' + args));
		}
	});
}

RedisCache.prototype.rpop = function(args) {
	let self = this,
		key;
	return new Promise((resolve, reject) => {
		if (args && (key = args.key)) {
			self.activateClient()
				.then((client) => {
					client.rpop(key, (err, res) => {
						if (err) {
							logger.error('failed to rpop, key: ' + key, err.message, err.stack);
							reject(err);
						} else {
							resolve(res);
						}
					});
					client.quit();
				});
		} else {
			reject(new Error('empty args' + args));
		}
	});
}

RedisCache.prototype.publish = function(args) {
	let self = this,
		key, value;
	return new Promise((resolve, reject) => {
		if (args && (key = args.key) && (value = args.value)) {
			self.activateClient()
				.then((client) => {
					client.publish(key, value, (err, res) => {
						if (err) {
							logger.error('failed to publish, key: ' + key + ', value: ' + value, err.message, err.stack);
							reject(err);
						} else {
							resolve(res);
						}
					});
					client.quit();
				});
		} else {
			reject(new Error('empty args' + args));
		}
	});
}

RedisCache.prototype.subscribe = function(args) {
	let self = this,
		key;
	return new Promise((resolve, reject) => {
		if (args && (key = args.key)) {
			self.activateClient().then((client) => {
				client.on('message', function(channel, message) {
					resolve({
						channel: channel,
						message: message
					});
					client.quit();
				});
				client.subscribe(key);
			});
		} else {
			reject(new Error('empty args' + args));
		}
	});
}

RedisCache.prototype.parseObjectResult = function(result) {
	let self = this;
	return new Promise((resolve, reject) => {
		if (result) {
			try {
				resolve(JSON.parse(result));
			} catch (err) {
				logger.error('parseObjectResult err: ', err);
				reject(err);
			}
		} else {
			resolve(null);
		}
	});
}

RedisCache.prototype.genZsetArgs = function(key, data, memberField, scoreField) {
	let self = this;
	return new Promise((resolve, reject) => {
		if (!key) {
			return reject(new Error('empty key!', key));
		}
		if (!data) {
			return reject(new Error('empty data!', data));
		}
		if (typeof scoreCalculator !== 'function') {
			return reject(new Error('scoreCalculator is not a function!'));
		}
		if (!Array.isArray(data)) {
			data = [data];
		}
		memberField = memberField || 'id';
		if (scoreField) {
			let scoreMap = {};
			data.forEach((item) => {
				let score = item[scoreField],
					member = item[memberField];
				if (!score || !member) {
					return reject(new Error('empty score or member: ', item));
				}
				scoreMap[member] = score;
			});
			resolve({
				key: key,
				scoreMap: scoreMap
			});
		} else {
			let members = [];
			data.forEach((item) => {
				let member = item[memberField];
				if (!member) {
					return reject(new Error('empty member: ', item));
				}
				members.push(member);
			});
			resolve({
				key: key,
				members: members
			});
		}
	});
}

module.exports = RedisCache;