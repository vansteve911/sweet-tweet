'use strict';
const crypto = require('crypto'),
  fs = require('fs'),
  config = require('../config'),
  constants = require('constants'),

  PASSWORD_KEY = fs.readFileSync(config.security.passwordKey).toString('ascii'),
  PRIVATE_KEY = fs.readFileSync(config.security.serverKey).toString(),
  PUBLIC_KEY = fs.readFileSync(config.security.clientKey).toString(),
  PUBLIC_CERT = fs.readFileSync(config.security.clientCert).toString(),

  MODULUS = 1024,
  MAX_BITS = MODULUS / 8,
  BLOCK_LENGTH = MODULUS / 8 - 11;

// hash
module.exports.genID = function(str) {
  return parseInt(crypto.createHash('sha1').update(str).digest('hex').substr(0, 13), 16);
};

module.exports.encryptPassword = function(password) {
  let hmac = crypto.createHmac('sha1', PASSWORD_KEY);
  return hmac.update(password).digest('hex');
}

module.exports.genHash = function(input) {
  return crypto.createHash('MD5').update(input).digest('hex');
}

module.exports.genNonce = function(input) {
  input = input || '';
  return crypto.createHash('MD5').update(input + (new Date()).getTime().toString() + parseInt(Math.random() * 10000)).digest('hex');
}

module.exports.genRnd = function() {
  return crypto.randomBytes(64).toString('base64');
}

// signature
module.exports.genServerSignature = function(input) {
  return genSign(input, true);
}

module.exports.genClientSignature = function(input) {
  return genSign(input, false);
}

module.exports.verifyServerSignature = function(text, sign) {
  return verifySign(text, sign, false);
}

module.exports.verifyClientSignature = function(text, sign) {
  return verifySign(text, sign, true);
}

module.exports.genDigest = function(text) {
  if (text && typeof text === 'string') {
    return crypto.createHash('SHA1').update(text).digest('hex');
  }
  return null;
}

module.exports.verifyDigest = function(text, digest) {
  if (text && typeof text === 'string' && digest && typeof digest === 'string') {
    let _digest = crypto.createHash('SHA1').update(text).digest('hex');
    console.log(digest, _digest);
    return digest === _digest;
  }
  return false;
}

module.exports.convertToOriginalStr = function(obj) {
  if (obj && typeof obj === 'object') {
    let keys = [],
      str = '';
    for (let k of Object.keys(obj)) {
      keys.push(k);
    }
    keys.sort().forEach((k) => {
      str += obj[k] + '&';
    });
    return str;
  }
  return null;
}

function genSign(input, usePrivateKey) {
  if (input && typeof input === 'string') {
    let sign = crypto.createSign('RSA-SHA256'),
      key = usePrivateKey ? PRIVATE_KEY : PUBLIC_CERT;
    sign.update(input);
    return sign.sign(key, 'hex');
  }
  return null;
}

function verifySign(text, sign, usePrivateKey) {
  if (text && typeof text === 'string' && sign && typeof sign === 'string') {
    let verify = crypto.createVerify('RSA-SHA256'),
      key = usePrivateKey ? PRIVATE_KEY : PUBLIC_CERT;
    verify.update(text);
    return verify.verify(key, sign, 'hex');
  }
  return false;
}

// RSA encrypt & decrypt
module.exports.rsaPublicEncrypt = function(input) {
  return rsaEncrypt(input, true);
}

module.exports.rsaPrivateEncrypt = function(input) {
  return rsaEncrypt(input, false);
}

module.exports.rsaPublicDecrypt = function(input) {
  return rsaDecrypt(input, true);
}

module.exports.rsaPrivateDecrypt = function(input) {
  return rsaDecrypt(input, false);
}

function getByteLength(str, coding) {
  if (typeof str !== 'string') {
    throw new Error("invalid str");
  }
  coding = coding || 'utf8';
  return Buffer.byteLength(str, coding);
}

function rsaEncrypt(input, isPublic) {
  let oriBuff = new Buffer(input),
    byteLen = getByteLength(input),
    resultBuff = new Buffer(''),
    cursor = 0,
    keyObj = {
      key: isPublic ? PUBLIC_KEY : PRIVATE_KEY,
      padding: constants.RSA_PKCS1_PADDING
    },
    curBuff, encryptedBlock;
  while (cursor < byteLen) {
    curBuff = oriBuff.slice(cursor, cursor + BLOCK_LENGTH);
    encryptedBlock = isPublic ? crypto.publicEncrypt(keyObj, curBuff) : crypto.privateEncrypt(keyObj, curBuff);
    resultBuff = Buffer.concat([resultBuff, encryptedBlock], resultBuff.length + encryptedBlock.length);
    cursor += BLOCK_LENGTH;
  }
  return resultBuff.toString('base64');
}

function rsaDecrypt(input, isPublic) {
  let oriBuff = new Buffer(input, 'base64'),
    byteLen = getByteLength(input, 'base64'),
    resultBuff = new Buffer(''),
    cursor = 0,
    curBuff, decryptedBlock,
    privateKey = {
      key: isPublic ? PUBLIC_KEY : PRIVATE_KEY,
      padding: constants.RSA_PKCS1_PADDING
    };
  while (cursor < byteLen) {
    curBuff = oriBuff.slice(cursor, cursor + MAX_BITS);
    decryptedBlock = isPublic ? crypto.publicDecrypt(privateKey, curBuff) : crypto.privateDecrypt(privateKey, curBuff);
    resultBuff = Buffer.concat([resultBuff, decryptedBlock], resultBuff.length + decryptedBlock.length);
    cursor += MAX_BITS;
  }
  return resultBuff.toString('utf8');
}

// AES 
module.exports.aesEncrypt = function(input, key) {
  if (input && typeof input === 'string' && key && typeof key === 'string') {
    let cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(input, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }
  return null;
}

module.exports.aesDecrypt = function(input, key) {
  if (input && typeof input === 'string' && key && typeof key === 'string') {
    let decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(input, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  return null;
}