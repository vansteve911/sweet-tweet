'use strict';

const qiniu = require('qiniu');

const config = require('../config.js');
const httpUtils = require('../utils/httpUtils.js');


const ACCESS_KEY = 'aGd6tKKpFEzizLNcqIoXfWqN1aMn03kuVM0d6KxP';
const SECRET_KEY = 'hMx5vhtmoFiWAoixuNSc6jxSKiLhBOBAOcVEuABI';
const KEY_PREFIX = config.upload.keyPrefix;

// 成员属性
const bucketName = config.upload.bucketName;// 空间名称 // 'vansteve911-com'; 
let client;

// constructors
function QiniuUtils() {
  //需要填写你的 Access Key 和 Secret Key
  qiniu.conf.ACCESS_KEY = ACCESS_KEY;
  qiniu.conf.SECRET_KEY = SECRET_KEY;
  client = new qiniu.rs.Client();
}

QiniuUtils.prototype.generateUploadedKey = function(filename) {
  return KEY_PREFIX + (filename || (new Date()).getTime());
}

QiniuUtils.prototype.generateUploadToken = function(key) {
  if (!key) {
    return null;
  }
  let putPolicy = new qiniu.rs.PutPolicy(bucketName + ':' + key);
  return putPolicy.token();
}

// 上传函数
QiniuUtils.prototype.uploadFile = function(upToken, key, filePath) {
  let extra = new qiniu.io.PutExtra();
  qiniu.io.putFile(upToken, key, filePath, extra, function(err, ret) {
    if (!err) {
      // 上传成功， 处理返回值
      console.log(ret.hash, ret.key, ret.persistentId);
    } else {
      // 上传失败， 处理返回代码
      console.log(err);
    }
  });
}

let qiniuUtils = new QiniuUtils();
module.exports = qiniuUtils;