'use strict';
const Tweet = require('../models/tweet'),
  logger = require('../logger');

let t = new Tweet();
// t.get(24).then(logger.debug);
t.add({"type":0,"content":"科科","user_id":1234}).then(logger.debug);

// let d= new Date();
// t.getList(d.getTime(), 10)
// .then(res=>{
//   logger.debug(666, res);
// })
// .catch((err)=>{
//   logger.error(err.message, err.stack)
// });
// t.get(1, function(err, res){
//   logger.debug('sdfsdfs');
//   if(err){
//     logger.error(err);
//   } else {
//     logger.debug(res);
//   }
// });
