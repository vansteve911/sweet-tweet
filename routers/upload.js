'use strict';

const util = require('util');
const express = require('express');
const multipart = require('connect-multiparty');

const qiniuUtils = require('../utils/qiniuUtils.js');
const httpUtils = require('../utils/httpUtils.js');
const apiResult = require('../apiResult.js')

const router = express.Router();

router.get('/', function(req, res) {
  apiResult(res);
});

router.get('/token', function(req, res) {
  let key = qiniuUtils.generateUploadedKey(req.param('filename'));
  let token = qiniuUtils.generateUploadToken(key);
  apiResult(res, {
    token: token,
    key: key
  });
});

router.post('/testUploadPic', multipart(), function(req, res) {
  console.log(req.body);
  console.log(req.files);
  apiResult(res);
});

router.post('/uploadFromUrl', function(req, res, next) {
  let url = req.param('url');
  let password = req.param('password');
  if ('tmptmptmp' !== password) { // TODO
    next(new Error('not authorized!'), req, res);
  } else if (url) {
    let key = qiniuUtils.generateUploadedKey(getFilePathName(url));
    let token = qiniuUtils.generateUploadToken(key);
    if (token) {
      console.log(util.format('begin uploading file [%s] to qiniu', url));
      httpUtils.doUploadFileFromUrl(url, 'http://upload.qiniu.com/', {
        key: key,
        token: token
      }, function(err, data) {
        if (err) {
          next(err, req, res);
        } else if (!data) {
          next(new Error('empty response from upload url'), req, res);
        } else {
          console.log(util.format('file [%s] upload success! response from qiniu: %s', url, data));
          let respJson = JSON.parse(data);
          apiResult(res, respJson);
        }
      });
    }
  } else {
    next(new Error('empty url'), req, res);
  }
});

function getFilePathName(path) {
  let res;
  return path && (res = path.match(/[^\/\\]+.\w$/)) && res[0];
}

module.exports = router;