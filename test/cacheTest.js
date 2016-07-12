'use strict';
const cache = require('../storage/cache');

let cacheStore = new cache();
// cacheStore.set({
//   key: 'abc',
//   value: 1
// }).then(console.log, function(err) {
//   console.error(err.message, err.stack)
// });
// cacheStore.zadd({key: 'za_1', scoreMap: {'abc':11.0 }}).then(console.log, console.error);
cacheStore.zrangebyscore({key: 'za_1', lower: '0', upper: '+inf',  limit:'10'}).then(console.log, console.error);
// cacheStore.get({key:'abc'}).then(console.log, function(err){console.error(err.message,err.stack)});  
// setTimeout(function() {
//   cacheStore.get({
//     key: 'abc'
//   }).then(console.log, function(err) {
//     console.error(err.message, err.stack)
//   });
// }, 4000);