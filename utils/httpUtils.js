'use strict';
const request = require('request');
const util = require('util');

function HttpUtils() {};

HttpUtils.prototype.doGet = function(url, callback) {
  request.get(url, function(err, res, body) {
    if (err) {
      callback(err);
    } else {
      if (res.statusCode == 200) {
        callback(undefined, body);
      } else {
        callback(new Error(util.format('GET url %s failed, statusCode: %s', url, res.statusCode)));
      }
    }
  });
}

HttpUtils.prototype.doPost = function(url, callback) {
  request.post(url, function(err, res, body) {
    if (err) {
      callback(err);
    } else {
      if (res.statusCode == 200) {
        callback(undefined, body);
      } else {
        callback(new Error(util.format('POST url %s failed, statusCode: %s', url, res.statusCode)));
      }
    }
  });
}

HttpUtils.prototype.doUploadFileFromUrl = function(url, uploadUrl, formData, callback) {
  let inStream = request.get(url);
  inStream.on('error', function(err) {
    callback(err);
  });
  formData = formData || {};
  formData.file = inStream;
  request.post({
    url: uploadUrl,
    formData: formData
  }, function(err, res, body){
    if(err){
      callback(err);  
    } else if(res){
      callback(null, body);
    } else {
      callback(new Error('no proper response!'));        
    }
  });
}

let httpUtils = new HttpUtils();
module.exports = httpUtils;