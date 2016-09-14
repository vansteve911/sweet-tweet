'use strict';

const util = require('util'),
  logger = require('../logger'),
  router = require('express').Router(),
  multipart = require('connect-multiparty'),
  qiniuUtils = require('../utils/qiniuUtils.js'),
  httpUtils = require('../utils/httpUtils.js'),
  apiResult = require('../apiResult.js'),
  ApiError = require('../common/apiError'),
  ErrorCode = require('../common/ErrorCode'),
  reqSession = require('../middlewares/session'),
  auth = require('../middlewares/auth');

router.get('/certs', reqSession, auth.userSession, auth.userAuth, function(req, res) {
  let certs = qiniuUtils.genUploadCerts(req.param('filename'));
  if(certs){
    apiResult(res, certs); 
  } else {
    apiResult(new ApiError('gen upload certs failed'), ErrorCode.FAILED);
  }
});

router.post('/uploadFromUrl', reqSession, auth.userSession, auth.userAuth, function(req, res, next) {
  let url = req.param('url');
  if (url) {
    let key = qiniuUtils.generateUploadedKey(getFilePathName(url));
    let token = qiniuUtils.generateUploadToken(key);
    if (token) {
      logger.debug(util.format('begin uploading file [%s] to qiniu', url));
      httpUtils.doUploadFileFromUrl(url, 'http://upload.qiniu.com/', {
        key: key,
        token: token
      }, function(err, data) {
        if (err) {
          next(err, req, res);
        } else if (!data) {
          next(new Error('empty response from upload url'), req, res);
        } else {
          logger.debug(util.format('file [%s] upload success! response from qiniu: %s', url, data));
          let respJson = JSON.parse(data);
          return apiResult(res, respJson);
        }
      });
    } else {
      apiResult(new ApiError('gen token failed'), ErrorCode.BAD_REQUEST);
    }
  } else {
    apiResult(new ApiError('empty url'), ErrorCode.BAD_REQUEST);
  }
});

function getFilePathName(path) {
  let res;
  return path && (res = path.match(/[^\/\\]+.\w$/)) && res[0];
}

module.exports = router;