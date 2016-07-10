'use strict';
const redis = require('redis'),
  config = require('../config');
// TODO

function RedisCache() {}

RedisCache.prototype.activateClient = function() {
  let self = this;
  if (!self.client || !self.client.connected) {
    self.client = redis.createClient(config.redis);
    self.client.on('error', function(err) {
      console.error('client error!', err.stack);
    });
    self.client.on('end', function() {
      console.log('client quit');
    });
    self.closeClientTimer = setTimeout(function() {
      self.client.quit();
    }, config.redis.idleTimeout);
  } else {
    // activate client
    if (self.closeClientTimer) {
      // cancel close timer
      clearTimeout(self.closeClientTimer);
      self.closeClientTimer = setTimeout(function() {
        self.client.quit();
      }, config.redis.idleTimeout);
    }
  }
}

RedisCache.prototype.get = function(args) {
  let self = this, key;
  return new Promise(function(resolve, reject) {
    self.activateClient();
    if (args && (key = args.key)) {
      self.client.get(key, function(err, res) {
        if (err) {
          console.error('failed to get key: ' + key, err.message, err.stack);
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
RedisCache.prototype.set = function(args) {
  let self = this, key, value;
  return new Promise(function(resolve, reject) {
    self.activateClient();
    if (args && (key = args.key) && (value = args.value)) {
      self.client.set(key, value, function(err, res) {
        if (err) {
          console.error('failed to set, key: ' + key + ', value: ' + value, err.message, err.stack);
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

module.exports = RedisCache;