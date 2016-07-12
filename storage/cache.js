'use strict';
const redis = require('redis'),
  config = require('../config');
// TODO

function RedisCache() {}

RedisCache.prototype.activateClient = () => {
  let self = this;
  return new Promise((resolve, reject)=>{
    try{
      let client = redis.createClient(config.redis);
      client.on('error', function(err) {
        console.error('redis client error!', err.stack);
      });
      client.on('end', function() {
        console.log('redis client quit');
      });
      resolve(client);
    } catch(err){
      reject(err);
    }
  })
}

RedisCache.prototype.get = (args) => {
  let self = this, key;
  return new Promise((resolve, reject) => {
    if(args && (key = args.key)){
      self.activateClient().then((client)=>{
        client.get(key, function(err, res) {
          if (err) {
            console.error('failed to get key: ' + key, err.message, err.stack);
            reject(err);
          } else {
            resolve(res);
          }
          client.quit();
        }).catch(err){
          reject(err);
        };
      })
    } else {
      reject(new Error('empty args' + args));
    }
  });
}

RedisCache.prototype.set = (args) => {
  let self = this, key, value;
  return new Promise(function(resolve, reject) {
    if (args && (key = args.key) && (value = args.value)) {
      self.activateClient().then((client)=>{
        client.set(key, value, (err, res) => {
          if (err) {
            console.error('failed to set, key: ' + key + ', value: ' + value, err.message, err.stack);
            reject(err);
          } else {
            resolve(res === 'OK');
          }
        });
        client.quit();
      }).catch(err){
        reject(err);
      };
    } else {
      reject(new Error('empty args' + args));
    }
  });
}

RedisCache.prototype.hmset = (args) =>{
  let self = this, key, map;
  return new Promise((resolve, reject) => {
    if (args && (key = args.key) && (map = args.map)) {
      let params = [];
      for (let k of Object.keys(map)) {
        params.push(k, map[k]);
      }
      self.activateClient().then((client)=>{
        client.hmset(key, params, (err, res)=> {
          if (err) {
            console.error('failed to hmset, key: ' + key + ', map: ' + map, err.message, err.stack);
            reject(err);
          } else {
            resolve(res === 'OK');
          }
        });
        client.quit();
      }).catch(err){
        reject(err);
      };
    } else {
      reject(new Error('empty args' + args));
    }
  });
}

RedisCache.prototype.hgetall = (args) => {
  let self = this, key;
  return new Promise((resolve, reject)=> {
    if (args && (key = args.key)) {
      self.activateClient().then((client)=>{
        client.hgetall(key, (err, res) =>{
          if (err) {
            console.error('failed to hgetall, key: ' + key, err.message, err.stack);
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

RedisCache.prototype.zadd = (args) => {
  let self = this, key, scoreMap;
  return new Promise((resolve, reject) => {
    if (args && (key = args.key) && (scoreMap = args.scoreMap)) {
      self.activateClient().then((client)=>{
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
        client.zadd(key, params, function(err, res) {
          if (err) {
            console.error('failed to zadd, key: ' + key + ', scoreMap: ' + scoreMap, err.message, err.stack);
            reject(err);
          } else {
            resolve(res);
          }
        });
        client.quit();

      }).catch(err){
        reject(err);
      };  
    } else {
      reject(new Error('empty args' + args));
    }
  });
}

RedisCache.prototype.zrangebyscore = (args) => {
  let self = this, key, lower, upper, count, offset, rev;
  return new Promise((resolve, reject) =>{
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
          console.error('failed to zadd, key: ' + key + ', params: ' + params, err.message, err.stack);
          reject(err);
        } else {
          resolve(res);
        }
      }
      self.activateClient().then((client)=>{
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


RedisCache.prototype.parseObjectResult = (result) => {
  let self = this;
  return new Promise((resolve, reject) => {
    if (result) {
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

module.exports = RedisCache;