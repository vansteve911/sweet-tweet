'use strict';

function apiResult(res, data) {
  data = data || {};
  res.json({
    code: 200,
    message: '',
    data: data
  });
}

module.exports = apiResult;