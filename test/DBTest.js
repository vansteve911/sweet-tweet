'use strict';
const Tweet = require('../models/tweet');

// DB.query('SELECT $1::date', [new Date()]).then(db.parseResultRows).then(function(result){
//   for(let r of result){
//     console.log(r);
//   }
// });

let tweet = new Tweet({
  content: '哈哈哈',
  config: {
    pics: [
      "asdfsd"
    ] 
  }
});

let db = new Tweet.dbStore();

db.create(tweet).then(console.log, console.error);
// db.selectById(1).then(function(result){
//   result.content = '嘿嘿嘿';
//   // console.log('sdsd'+result.dbStore.update);
//   db.update(result).then(console.log, console.error);
// });
db.selectListByTime(new Date(), 3).then(console.log);