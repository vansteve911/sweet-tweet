'use strict';
module.exports.parseDate = function(date) {
  if (date instanceof Date) {
    return date;
  } else if (typeof date === 'string') {
    let res;
    try {
      res = new Date()
    } catch (err) {
      logger.error(err);
      res = new Date();
    }
    return res;
  }
  return new Date();
}