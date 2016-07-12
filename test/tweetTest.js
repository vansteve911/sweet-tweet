'use strict';
const Tweet = require('../models/tweet');

let t = new Tweet();
t.cacheStore.getTweet(1).then(console.log);
t.getList(new Date(), 3, function(err, result){
  console.log(result, 1);
});
// t.get(1, function(err, res){
//   console.log('sdfsdfs');
//   if(err){
//     console.error(err);
//   } else {
//     console.log(res);
//   }
// });
