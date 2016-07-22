'use strict';
const SessionStore = require('../storage/sessionStore'),
  logger = require('../logger'),
  session = require('express-session');

let ss = new SessionStore(session);

ss.set('token', '12345', (err,res)=>{
  if(err){
    logger.error(err, err.stack);
  } else {
    logger.debug(res);
  }
})

ss.get('token', (err,res)=>{
  if(err){
    logger.error(err, err.stack);
  } else {
    logger.debug(res);
  }
})

ss.destroy('token', (err,res)=>{
  if(err){
    logger.error(err, err.stack);
  } else {
    logger.debug(res);
  }
})



ss.get('token', (err,res)=>{
  if(err){
    logger.error(err, err.stack);
  } else {
    logger.debug(res);
  }
})
