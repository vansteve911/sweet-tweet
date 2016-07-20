'use strict';
const ApiError = require('../common/apiError'),
  ErrorCode = require('../common/errorCode'),
  userService = require('../services/userService');

module.exports.userSession = function(req, res, next) {
  if (req.session && req.session.userId) {
    // TODO get user by userId
    req.user = {
      id: req.session.userId,
      name: 'admin'
    }
  }
  next();
}

module.exports.userAuth = function(req, res, next) {
  if (req.user) {
    next()
  } else {
    next(new ApiError('user not login', ErrorCode.UNAUTHORIZED));
  }
}