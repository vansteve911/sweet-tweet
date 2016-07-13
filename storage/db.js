'use strict';
const config = require('../config');
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
  if (typeof args === 'string') {
    sql = args;
  } else {
    sql = args.sql || '';
    params = args.params || [];
  }
  return _connect().then(function(result) {
    let client = result.client;
    let done = result.done;
    return new Promise(function(resolve, reject) {
      if (!sql) {
        reject(new Error('invalid query, empty sql'));
      } else if (args.withParams && params.length === 0) {
        reject(new Error('invalid query, empty params'));
      } else
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

DB.prototype.saveAndGet = function(args) {
  let self = this;
  args = args || {};
  args.withParams = true;
  return self.query(args).then(self.parseResultRow);
}

DB.prototype.save = function(args) {
  let self = this;
  args = args || {};
  args.withParams = true;
  return self.query(args).then(self.parseAffectedRowCount);
}

DB.prototype.select = function(args) {
  let self = this;
  return self.query(args).then(self.parseResultRow);
};

DB.prototype.selectList = function(args) {
  let self = this;
  return self.query(args).then(self.parseResultRows);
};


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
DB.prototype.parseAffectedRowCount = function(result) {
  return new Promise(function(resolve, reject) {
    if (!result || !result.rowCount) {
      reject(new Error('invalid affected rows'));
    } else {
      resolve(result.rowCount);
    }
  });
}

module.exports = DB;