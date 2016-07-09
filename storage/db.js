'use strict';
const config = require('../config.js');
const pg = require('pg');

function DB() {}

let _connect = function() {
  return new Promise(function(resolve, reject) {
    let pool = new pg.Pool(config.postgre);
    pool.connect(function(err, client, done) {
      done();
      if (err) {
        console.error('connect db failed', err.stack);
        reject(err);
      } else {
        resolve({
          client: client,
          done: done
        });
      }
    });
    pool.on('error', function(err, client) {
      console.error('connect db error', err.stack);
      reject(err);
    });
  });
}

DB.prototype.query = function(args) {
  args = args || {};
  let sql;
  let params;
  if(typeof args === 'string'){
    sql = args;
  } else {
    sql = args.sql || '';
    params = args.params || {};
  }
  return _connect().then(function(result) {
    let client = result.client;
    let done = result.done;
    return new Promise(function(resolve, reject) {
      client.query(sql, params, function(err, res) {
        done(); // release connection
        if (err) {
          console.error('query error!', err.stack);
          reject(err);
        } else {
          resolve(res);
        }
      })
    });
  });
}
DB.prototype.parseResultRows = function(result) {
  return new Promise(function(resolve, reject) {
    if (!result || !result.rows || !Array.isArray(result.rows)) {
      let err = new Error('empty result!');
      console.error(err.message, err.stack);
      reject(err);
    } else {
      resolve(result.rows);
      return;
    }
  });
}
DB.prototype.parseResultRow = function(result) {
  return new Promise(function(resolve, reject) {
    if (!result || !result.rows || !Array.isArray(result.rows) || result.rows.length !== 1) {
      let err = new Error('invalid result!');
      console.error(err.message, err.stack);
      reject(err);
    } else {
      resolve(result.rows[0]);
      return;
    }
  });
}

module.exports = DB;