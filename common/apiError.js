'use strice';
const util = require('util');
function ApiError(message, code){
  this.message = message || '';
  this.code = parseInt(code) || 0;
}
util.inherits(ApiError, Error);

module.exports = ApiError;