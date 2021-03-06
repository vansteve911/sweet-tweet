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
cacheStore.zadd({
  key: 'za_1',
  scoreMap: {
    'abc': 11.0,
    'def': 22.0
  }
}).then(logger.debug, logger.error);

setTimeout(function() {
  cacheStore.zrem({
    key: 'za_1',
    members: ['def']
  })
}, 100);
// cacheStore.zrangebyscore({key: 'za_1', lower: '0', upper: '+inf',  limit:'10'}).then(logger.debug, logger.error);
// cacheStore.get({key:'abc'}).then(logger.debug, function(err){logger.error(err.message,err.stack)});  
// setTimeout(function() {
//   cacheStore.get({
//     key: 'abc'
//   }).then(logger.debug, function(err) {
//     logger.error(err.message, err.stack)
//   });
// }, 4000);
// cacheStore.rpop({
//   key: 'l1_1',
//   value: 'abc'
// }).then(console.log, console.error);

// cacheStore.subscribe({
//     key: 'ch_1'
//   })
//   .then((res) => {
//     logger.debug('received msg from channel ' + res.channel + ', msg: ' + res.message);
//   }, (err) => {
//     logger.error(err);
//   });

// setTimeout(function() {
// cacheStore.publish({
//   key: 'ch_1',
//   value: 'abcde'
// })
// .then((res) => {
//   logger.debug('received msg from channel ' + res.channel + ', msg: ' + res.message);
// }, (err) => {
//   logger.error(err);
// });
// }, 1000);