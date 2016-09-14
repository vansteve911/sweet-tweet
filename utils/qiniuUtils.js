'use strict';
const qiniu = require('qiniu'),
  config = require('../config.js'),
  // httpUtils = require('../utils/httpUtils.js'),
  cryptUtils = require('./cryptUtils');


const ACCESS_KEY = config.upload.accessKey,
  SECRET_KEY = config.upload.secretKey,
  KEY_PREFIX = config.upload.keyPrefix,
  BUCKET_NAME = config.upload.bucketName, // 空间名称 // 'vansteve911-com'; 
  URL_RREFIX = config.upload.host;

// constructors
function QiniuUtils() {
  //需要填写你的 Access Key 和 Secret Key
  qiniu.conf.ACCESS_KEY = ACCESS_KEY;
  qiniu.conf.SECRET_KEY = SECRET_KEY;
  this.client = new qiniu.rs.Client();
}

function genUploadedKey(filename) {
  return KEY_PREFIX + cryptUtils.genNonce(filename);
}

function genUploadToken(key) {
  if (!key) {
    return null;
  }
  let putPolicy = new qiniu.rs.PutPolicy(BUCKET_NAME + ':' + key);
  return putPolicy.token();
}

QiniuUtils.prototype.genUploadCerts = function(filename){
  let key = genUploadedKey(filename),
    token = genUploadToken(key),
    url = URL_RREFIX + key;
  if(key && token && url){
    return {
      key: key,
      token: token,
      url: url
    }
  }
}

// 上传函数
QiniuUtils.prototype.uploadFile = function(upToken, key, filePath) {
  return new Promise((resolve, reject) => {
    if (upload && key && filePath) {

    } else {
      reject(new ApiError('empty args, upload: ' + upload + ', key: ' + key + ', filePath: ' + filePath))
    }
    let extra = new qiniu.io.PutExtra();
    qiniu.io.putFile(upToken, key, filePath, extra, function(err, ret) {
      if (err) {
        logger.warn('failed to upload');
        logger.error(err);
        reject(err);

      } else {
        logger.debug('upload success: ' + key);
        resolve({
          hash: ret.hash,
          key: ret.key,
          persistentId: ret.persistentId
        })
      }
    });
  });
}

QiniuUtils.prototype.parseUploadResponse = function(res){
  if(res && res.key){
    return URL_RREFIX + res.key; 
  }
  return null;
}

let qiniuUtils = new QiniuUtils();
module.exports = qiniuUtils;