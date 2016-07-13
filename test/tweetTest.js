'use strict';
const Tweet = require('../models/tweet');

let t = new Tweet();
// t.cacheStore.getTweet(1).then(console.log);

let d= new Date();
t.getList(d.getTime(), 3)
.then(res=>{
  console.log(666, res);
})
.catch((err)=>{
  console.error(err.message, err.stack)
});
// t.get(1, function(err, res){
//   console.log('sdfsdfs');
//   if(err){
//     console.error(err);
//   } else {
//     console.log(res);
//   }
// });
