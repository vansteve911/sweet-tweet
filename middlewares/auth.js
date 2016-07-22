'use strict';
const ApiError = require('../common/apiError'),
  ErrorCode = require('../common/errorCode'),
  logger = require('../logger'),
  userService = require('../services/userService');

module.exports.userSession = function(req, res, next) {
  if (req.session && req.session.userId) {
    userService.get(req.session.userId)
    .then((user)=>{
      req.user = user;   
    })
    .catch(logger.error);
  }
  next();
}

module.exports.userAuth = function(req, res, next) {
  if (req.user) {
    next();
  } else {
    next(new ApiError('user not login', ErrorCode.UNAUTHORIZED));
  }
}