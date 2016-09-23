'use strict';
const logger = require('../logger');

module.exports.parseDate = function(date) {
  if (date instanceof Date) {
    return date;
  } else if (typeof date === 'string') {
    let res;
    try {
      res = new Date(res)
    } catch (err) {
      logger.error(err);
      res = new Date();
    }
    return res;
  }
  return new Date();
}