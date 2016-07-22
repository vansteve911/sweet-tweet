'use strict';
const cache = require('../storage/cache'),
  logger = require('../logger');

let cacheStore = new cache();
// cacheStore.set({
//   key: 'abc',
//   value: 1
// }).then(logger.debug, function(err) {
//   logger.error(err.message, err.stack)
// });
// cacheStore.zadd({key: 'za_1', scoreMap: {'abc':11.0 }}).then(logger.debug, logger.error);
cacheStore.zrangebyscore({key: 'za_1', lower: '0', upper: '+inf',  limit:'10'}).then(logger.debug, logger.error);
// cacheStore.get({key:'abc'}).then(logger.debug, function(err){logger.error(err.message,err.stack)});  
// setTimeout(function() {
//   cacheStore.get({
//     key: 'abc'
//   }).then(logger.debug, function(err) {
//     logger.error(err.message, err.stack)
//   });
// }, 4000);