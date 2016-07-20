'use strict';
const RedisCache = require('../storage/cache'),
  util = require('util');
const oneDay = 86400;

function _noop() {}

function _getTTL(store, sess) {
  let maxAge = sess.cookie.maxAge;
  return store.ttl || (typeof maxAge === 'number' ? Math.floor(maxAge / 1000) : oneDay);
}

module.exports = function(session) {

  let Store = session.Store;

  util.inherits(SessionStore, Store);

  function SessionStore(options) {
    if (!(this instanceof SessionStore)) {
      throw new TypeError('Cannot call SessionStore constructor as a function');
    }
    console.log('into SessionStore, options: ', options); //TODO
    let self = this;
    options = options || {};
    Store.call(this, options);
    console.log('after Store.call');

    self.prefix = options.prefix || 'sess_';
    delete options.prefix;
    self.cacheStore = new RedisCache();
    self.ttl = options.ttl;
    self.disableTTL = options.disableTTL;
    // logErrors
    if (options.logErrors) {
      if (typeof options.logErrors != 'function') {
        options.logErrors = function(err) {
          console.error('Warning: connect-redis reported a client error: ' + err);
        };
      }
    }
  }

  SessionStore.prototype.get = function(sid, callback) {
    let self = this;
    callback = callback || _noop;
    console.log('into get');
    if (!sid) {
      callback(new Error('empty sid!'));
      return;
    }
    let sessKey = self.prefix + sid;
    console.log('sessKey: ', sessKey);
    self.cacheStore.get({
        key: sessKey
      })
      .then(self.cacheStore.parseObjectResult)
      .then((res) => {
        console.log('get session ok: key: ' + sessKey + ', value: ' + res); // 
        callback(null, res);
      })
      .catch((err) => {
        console.error('failed to get, key: ' + sessKey, err.stack);
        callback(err);
      });
  };

  SessionStore.prototype.set = function(sid, sess, callback) {
    let self = this;
    callback = callback || _noop;
    if (!sid || !sess) {
      callback(new Error('empty sid or sess!'));
      return;
    }
    console.log('into set');
    try {
      let value = JSON.stringify(sess);
      let sessKey = self.prefix + sid;
      self.cacheStore.set({
          key: sessKey,
          value: value
        })
        .then((res) => {
          callback(null);
        })
        .catch((err) => {
          console.error('failed to get, key: ' + sessKey, err.stack);
          callback(err);
        });
    } catch (err) {
      callback(new Error('failed to serialize sess: ' + sess));
    }
  };

  SessionStore.prototype.destroy = function(sid, callback) {
    let self = this;
    callback = callback || _noop;
    console.log('into destroy');
    if (!sid) {
      callback(new Error('empty sid!'));
      return;
    }
    let sessKey = self.prefix + sid;
    self.cacheStore.del({
        key: sessKey
      })
      .then((res) => {
        callback(null, res);
      }, (err) => {
        console.error('failed to del, key: ' + sessKey, err.stack);
        callback(err);
      });
  };

  SessionStore.prototype.touch = function(sid, sess, callback) {
    let self = this;
    callback = callback || _noop;
    if (self.disableTTL) {
      callback();
      return;
    }
    if (!sid || !sess) {
      callback(new Error('empty sid or sess!'));
      return;
    }
    console.log('into touch');
    if (!sess.cookie) {
      callback(new Error('empty session cookie!'));
      return;
    }
    let ttl = _getTTL(self, sess);
    let sessKey = self.prefix + sid;
    self.cacheStore.expire({
        key: sessKey,
        seconds: ttl
      })
      .then((res) => {
        callback.apply(this, arguments);
      }, (err) => {
        console.error('failed to touch, key: ' + sessKey, err.stack);
        callback(err);
      });
  };

  return SessionStore;
}