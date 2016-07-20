'use strict';

function apiResult(res, data, err) {
  data = data || {};
  let message = '', code = 200;
  if(err){
    console.error(err.message, err.stack);
    code = err.code || 500;
    message = err.message || '';
  }
  res.json({
    code: code,
    message: message,
    data: data
  });
}

module.exports = apiResult;