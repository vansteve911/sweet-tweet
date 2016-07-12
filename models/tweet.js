'use strict';
const util = require('util');
const DB = require('../storage/db');
const RedisCache = require('../storage/cache');

function Tweet(data) {
  data = data || {};
  this.id = parseInt(data.id) || 0; // 0-纯文字，1-带图，2-带视频
  this.type = parseInt(data.type) || 0;
  this.content = data.content || '';
  this.user_id = parseInt(data.user_id) || 0;
  this.time = data.time || new Date();
  this.config = data.config || {};
}

Tweet.prototype.get = function(id) {
  let self = this;
  return new Promise((resolve, reject) => {
    if (parseInt(id) !== NaN) {
      self.cacheStore.getTweet(id)
      .then((result) => {
        self.cacheStore.parseObjectResult(result)
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
                    console.error('' + err, err.stack);
                  });
              } else {
                // add empty item to cache
              }
            })
            .catch(reject);
          }
        })
        .catch(reject);
      });
    } else {
      reject(new Error('invalid id: ' + id));
    }
  });
}

Tweet.prototype.add = function(data) {
  let self = this;
  return new Promise((resolve, reject)=>{
    if(data){
      self.dbStore.create(data)
      .then((tweet) => {
        resolve(true);
        Promise.all(self.cacheStore.setTweet(tweet), self.cacheStore.addToTweetIdList(tweet))
          catch(console.error); 
      })
      .catch(reject);
    } else {
      resolve(false);
    }
  });
}

Tweet.prototype.getList = function(score, count) {
  let self = this;
  let _errLogAnd
  return new Promise((resolve, reject) => {
    if((score = parseFloat(score)) && (count = parseInt(count)) && count > 0){
      self.cacheStore.getTweetIdList({
        score: score,
        count: count
      })
      .then((idList)=>{
        if(Array.isArray(idList) && idList.length > 0){
          let promises =idList.map((id)=>{
            self.getId(id)
          });
          Promise.all(promises)
          .then(resolve)
          .catch(reject);
        } else {
          // get from db
          self.dbStore.getTweetList(score, count, 0)
          .then((tweets)=>{
            if(tweets){
              resolve(tweets);
              let promises =idList.map((tweet)=>{
                self.add(tweet)
              });
              Promise.all(promises)
              .catch(console.error);
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

  self.cacheStore.getTweetIdList({
      score: score,
      count: count
    })
    .then((list) => {
      return new Promise(function(resolve, reject) {
        if (!list || !Array.isArray(list)) {
          resolve();
        } else {
          if (list.length === 0) {
            self.dbStore.getTweetList(score, count, 0).then(function(results) {
              console.log(results);
              self.cacheStore.addToTweetIdList(results).then(function(res) {
                callback(null, results);
              }, function(err) {
                callback(err);
              });
            }, function(err) {
              callback(err);
            });
            return;
          }
          let promises = [];
          list.forEach(function(id) {
            promises.push(new Promise(function(_resolve, _reject) {
              self.get(id, function(err, res) {
                if (err) {
                  _reject(err);
                } else {
                  _resolve(res);
                }
              })
            }));
          });
          Promise.all(promises).then(function(results) {
            callback(null, results);
          }, function(err) {
            callback(err);
          });
        }
      });
    });
}

/*****/

function CacheStore() {}
util.inherits(CacheStore, RedisCache);
Tweet.prototype.cacheStore = new CacheStore();

CacheStore.prototype.keyPrefixes = {
  tweet: 't_',
  tweetIdList: 'til_'
}

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
      self.client.zadd({
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
    if (args && (score = args.score) && (offset = args.offset) && (count = args.count)) {
      self.zrangebyscore({
        key: key,
        upper: score,
        lower: 0,
        count: count
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
  create: 'INSERT INTO tweet (type, content, user_id, time, config) VALUES($1::smallint, $2::text, $3::bigint, $4::date, $5::text) RETURNING id;',
  update: 'UPDATE tweet SET type = $1::smallint, content = $2::text, user_id = $3::bigint, time = $4::date, config = $5::text WHERE id = $6::int',
  select: 'SELECT * FROM tweet WHERE id = $1::int',
  selectByTime: 'SELECT * FROM tweet WHERE time < $1::date ORDER BY time DESC LIMIT $2::int OFFSET $3::int',
};

DbStore.prototype.create = function(data) {
  let tweet = new Tweet(data);
  let self = this,
    args = {
      sql: self.sqls.create,
      params: [tweet.type, tweet.content, tweet.user_id, tweet.time, tweet.config]
    };
  return new Promise(function(resolve, reject) {
    return self.saveAndGet(args).then(function(result) {
      if (!result) {
        reject(new Error('create failed'));
      } else {
        tweet.id = result.id;
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
      params: [tweet.type, tweet.content, tweet.user_id, tweet.time, tweet.config, tweet.id]
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