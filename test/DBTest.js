'use strict';
const Tweet = require('../models/tweet'),
  logger = require('../logger');

// DB.query('SELECT $1::date', [new Date()]).then(db.parseResultRows).then(function(result){
//   for(let r of result){
//     logger.debug(r);
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

db.create(tweet).then(logger.debug, logger.error);
// db.selectById(1).then(function(result){
//   result.content = '嘿嘿嘿';
//   // logger.debug('sdsd'+result.dbStore.update);
//   db.update(result).then(logger.debug, logger.error);
// });
db.selectListByTime(new Date(), 3).then(logger.debug);