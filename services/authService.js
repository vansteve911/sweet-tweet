'use strict';
const ApiError = require('../common/apiError'),
  ErrorCode = require('../common/errorCode'),
  logger = require('../logger'),
  userService = require('./userService');

function AuthService() {}

AuthService.prototype.login = function(args, req, res) {
  return new Promise((resolve, reject) => {
    logger.debug('into login');
    if (!req || !req.session) {
      reject(new ApiError('session not supported!'));
    }
    logger.debug('loginING, req.session: ', req.session);
    let account, password;
    if (args && (account = args.account) && (password = args.password)) {
      userService.authenticate(account, password)
      .then((loginUser)=>{
        // set login user in session
        req.session.regenerate(function() {
          req.session.userId = loginUser.id;
          req.user = loginUser;
          resolve(loginUser);
        });
      })
      .catch(reject);
    } else {
      reject(new ApiError('illegal account or password!', ErrorCode.UNAUTHORIZED));  
    }
  });
}

AuthService.prototype.logout = function(req, res) {
  return new Promise((resolve, reject) => {
    if (!req || !req.session) {
      reject(new ApiError('session not supported!'));
    }
    logger.debug('logoutING, req.session: ', req.session);
    if (req.session.userId) {
      req.session.destroy(function(err) {
        if (err) {
          logger.error('failed to destroy session: ', err.stack);
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      reject(new ApiError('user not logged in!', ErrorCode.UNAUTHORIZED));
    }
  });
}

AuthService.prototype.myInfo = function(req, res) {
  return new Promise((resolve, reject) => {
    if (!req || !req.session) {
      reject(new ApiError('session not supported!'));
    }
    logger.debug('myInfoING, req.session: ', req.session);
    if (req.user) {
      resolve(req.user);
    } else {
      reject(new ApiError('user not logged in!', ErrorCode.UNAUTHORIZED));
    }
  });
}

module.exports = new AuthService();