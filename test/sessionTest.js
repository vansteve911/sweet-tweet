'use strict';
const SessionStore = require('../storage/sessionStore'),
  session = require('express-session');

let ss = new SessionStore(session);

ss.set('token', '12345', (err,res)=>{
  if(err){
    console.error(err, err.stack);
  } else {
    console.log(res);
  }
})

ss.get('token', (err,res)=>{
  if(err){
    console.error(err, err.stack);
  } else {
    console.log(res);
  }
})

ss.destroy('token', (err,res)=>{
  if(err){
    console.error(err, err.stack);
  } else {
    console.log(res);
  }
})



ss.get('token', (err,res)=>{
  if(err){
    console.error(err, err.stack);
  } else {
    console.log(res);
  }
})
