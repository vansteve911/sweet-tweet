'use strict';
const ApiError = require('../common/apiError'),
  ErrorCode = require('../common/errorCode'),
  logger = require('../logger'),
  userService = require('../services/userService');

module.exports.userSession = function(req, res, next) {
  if (req.session && req.session.userId) {
    userService.get(req.session.userId)
      .then((user) => {
        req.user = user;
        next();
      })
      .catch((err) => {
        logger.error(err);
        next();
      });
  } else {
    logger.debug('empty user session');
    next();
  }
}

module.exports.userAuth = function(req, res, next) {
  if (req.user) {
    next();
  } else {
    logger.debug('user not login');
    next(new ApiError('user not login', ErrorCode.UNAUTHORIZED));
  }
}

module.exports.pageUserAuth = function(req, res, next, redirectView) {
  redirectView = redirectView || 'login';
  if (req.user) {
    next();
  } else {
    res.render(redirectView, {
      title: '登录',
      isLogin: true
    })
  }
}