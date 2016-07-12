'use strict';
const redis = require('redis'),
  config = require('../config');
// TODO

function RedisCache() {}

RedisCache.prototype.activateClient = function() {
  let self = this;
  if (!self.client) {
    self.client = redis.createClient(config.redis);
    self.client.on('error', function(err) {
      console.error('redis client error!', err.stack);
    });
    self.client.on('end', function() {
      console.log('redis client quit');
    });
  }
}

RedisCache.prototype.get = function(args) {
  let self = this,
    key;
  return new Promise(function(resolve, reject) {
    self.activateClient();
    if (args && (key = args.key)) {
      self.client.get(key, function(err, res) {
        if (err) {
          console.error('failed to get key: ' + key, err.message, err.stack);
          reject(err);
        } else {
          // resolve to obj or string
          resolve(res);
        }
      });
    } else {
      reject(new Error('empty args'));
    }
  });
}
RedisCache.prototype.set = function(args) {
  let self = this,
    key, value;
  return new Promise(function(resolve, reject) {
    self.activateClient();
    if (args && (key = args.key) && (value = args.value)) {
      self.client.set(key, value, function(err, res) {
        if (err) {
          console.error('failed to set, key: ' + key + ', value: ' + value, err.message, err.stack);
          reject(err);
        } else {
          resolve(res === 'OK');
        }
      });
    } else {
      reject(new Error('empty args'));
    }
  });
}
RedisCache.prototype.hmset = function(args) {
  let self = this,
    key, map;
  return new Promise(function(resolve, reject) {
    self.activateClient();
    if (args && (key = args.key) && (map = args.map)) {
      let params = [];
      for (let k of Object.keys(map)) {
        params.push(k, map[k]);
      }
      self.client.hmset(key, params, function(err, res) {
        if (err) {
          console.error('failed to hmset, key: ' + key + ', map: ' + map, err.message, err.stack);
          reject(err);
        } else {
          resolve(res === 'OK');
        }
      });
    } else {
      reject(new Error('empty args'));
    }
  });
}

RedisCache.prototype.hgetall = function(args) {
  let self = this,
    key;
  return new Promise(function(resolve, reject) {
    self.activateClient();
    if (args && (key = args.key)) {
      self.client.hgetall(key, function(err, res) {
        if (err) {
          console.error('failed to hgetall, key: ' + key, err.message, err.stack);
          reject(err);
        } else {
          resolve(res);
        }
      });
    } else {
      reject(new Error('empty args'));
    }
  });
}

RedisCache.prototype.zadd = function(args) {
  let self = this,
    key, scoreMap;
  return new Promise(function(resolve, reject) {
    self.activateClient();
    if (args && (key = args.key) && (scoreMap = args.scoreMap)) {
      let params = [];
      for (let member of Object.keys(scoreMap)) {
        let score = parseFloat(scoreMap[member]);
        if (!score) {
          let err = new Error('failed to parse float score: ' + scoreMap.member);
          console.error(err);
          reject(err);
          return;
        }
        params.push(score, member); // score member
      }
      self.client.zadd(key, params, function(err, res) {
        if (err) {
          console.error('failed to zadd, key: ' + key + ', scoreMap: ' + scoreMap, err.message, err.stack);
          reject(err);
        } else {
          resolve(res);
        }
      });
    } else {
      reject(new Error('empty args'));
    }
  });
}

RedisCache.prototype.zrangebyscore = function(args) {
  let self = this,
    key, lower, upper, count, offset, rev;
  return new Promise(function(resolve, reject) {
    self.activateClient();
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
      let callback = function(err, res) {
        if (err) {
          console.error('failed to zadd, key: ' + key + ', params: ' + params, err.message, err.stack);
          reject(err);
        } else {
          resolve(res);
        }
      }
      if (rev) {
        self.client.zrevrangebyscore(key, params, callback);
      } else {
        self.client.zrangebyscore(key, params, callback);
      }
      self.client.quit();
    } else {
      reject(new Error('empty args'));
    }
  });
}


RedisCache.prototype.parseObjectResult = function(result) {
  let self = this;
  return new Promise(function(resolve, reject) {
    if (!result) {
      try {
        resolve(JSON.parse(result));
      } catch (err) {
        reject(err);
      }
    } else {
      resolve(null);
    }
  });
}

RedisCache.prototype.parseListResult = function(result) {
  let self = this;
  return new Promise(function(resolve, reject) {
    if (!result) {
      resolve(result);
    } else {
      resolve(null);
    }
  });
}



module.exports = RedisCache;