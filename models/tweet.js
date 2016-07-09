'use strict';
const util = require('util');
const DB = require('../storage/db.js');

function Tweet(args) {
  args = args || {};
  let self = this;
  self.id = parseInt(args.id) || 0; // 0-纯文字，1-带图，2-带视频
  self.type = parseInt(args.type) || 0;
  self.content = args.content || '';
  self.user_id = parseInt(args.user_id) || 0;
  self.time = args.time || new Date(0);
  self.config = args.config || {};
  // storage
  self.dbStore = new DbStore(self);
}

function DbStore(model) {
  let self = this;
  self.model = model;
}
util.inherits(DbStore, DB);

DbStore.prototype.sqls = {
  create: 'INSERT INTO tweet (type, content, user_id, time, config) VALUES($1::smallint, $2::text, $3::bigint, $4::date, $5::text) RETURNING id;',
  update: 'UPSERT INTO tweet (type, content, user_id, time, config, id) VALUES($1::smallint, $2::text, $3::bigint, $4::date, $5::text, $6::int)',
  select: 'SELECT * FROM tweet WHERE id = $1::int',
};
DbStore.prototype.create = function() {
  let self = this;
  let tweet = self.model;
  let sql = self.sqls.create;
  let params = [tweet.type, tweet.content, tweet.user_id, tweet.time, tweet.config];
  return new Promise(function(resolve, reject) {
    self.query(sql, params)
      .then(self.parseResultRows)
      .then(function(result) {
        if (!result || result.length !== 1 || !result[0].id) {
          reject(new Error('insert failed, empty id'));
        } else {
          tweet.id = (result[0]).id;
          resolve(tweet);
        }
      });
  });
}
DbStore.prototype.update = function() {
  let self = this;
  let tweet = self.model;
  let sql = self.sqls.update;
  let params = [tweet.type, tweet.content, tweet.user_id, tweet.time, tweet.config, tweet.id];
  return new Promise(function(resolve, reject) {
    self.query(sql, params)
      .then(function(result) {
        if (!result || result.rowCount) {
          reject(new Error('update failed'));
        } else {
          resolve(result);
        }
      });
  });
}
DbStore.prototype.select = function(args) {
  let self = this;
  let filter = function() {
    return new Promise(function(resolve, reject) {
      if (!args || !parseInt(args.id)) {
        reject(new Error('invalid id'));
      } else {
        let sql = self.sqls.select;
        let params = [args.id];
        resolve({
          sql: sql, params: params
        });
      }
    });
  }
  return filter().then(self.query).then(self.parseResultRow);
};


module.exports = Tweet;