'use strict';
const DB = require('../storage/db.js'),
  Tweet = require('../models/tweet');

// DB.query('SELECT $1::date', [new Date()]).then(db.parseResultRows).then(function(result){
//   for(let r of result){
//     console.log(r);
//   }
// });

let tweet = new Tweet({
  content: '哈哈哈'
});
// tweet.dbStore.create().then(console.log, console.error);

tweet.dbStore.select({id: 1}).then(console.log, console.error);