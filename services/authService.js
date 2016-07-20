'use strict';
const ApiError = require('../common/apiError'),
  ErrorCode = require('../common/errorCode');

function AuthService() {}

AuthService.prototype.login = function(args, req, res) {
  return new Promise((resolve, reject) => {
    if (!req || !req.session) {
      reject(new ApiError('session not supported!'));
    }
    console.log('loginING, req.session: ', req.session);
    let username, password;
    if (args && (username = args.username) && (password = args.password)) {
      if (username === 'admin' && password === 'admin') { // TODO
        let loginUser = {
            id: 110,
            name: 'admin'
          }
          // set login user in session
        req.session.regenerate(function() {
          req.session.userId = loginUser.id;
          req.user = loginUser;
          resolve(loginUser);
        });
        return;
      }
    }
    reject(new ApiError('illegal username or password!', ErrorCode.UNAUTHORIZED));
  });
}

AuthService.prototype.logout = function(req, res) {
  return new Promise((resolve, reject) => {
    if (!req || !req.session) {
      reject(new ApiError('session not supported!'));
    }
    console.log('logoutING, req.session: ', req.session);
    if (req.session.userId) {
      req.session.destroy(function(err) {
        if (err) {
          console.error('failed to destroy session: ', err.stack);
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
    console.log('myInfoING, req.session: ', req.session);
    if (req.user) {
      resolve(req.user);
    } else {
      reject(new ApiError('user not logged in!', ErrorCode.UNAUTHORIZED));
    }
  });
}

module.exports = new AuthService();