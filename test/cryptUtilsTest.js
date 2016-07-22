'use strict';
const cryptUtils = require('../utils/cryptUtils'),
  logger = require('../logger');

// let p = '23423sdfsdafd4';
// logger.debug(cryptUtils.encryptPassword(p));
// logger.debug(cryptUtils.genID('sdfasfasdddddfasfd'));

// let nonce = cryptUtils.genNonce();
// let sign = cryptUtils.genServerSignature(nonce);
// logger.debug(nonce, sign);
// logger.debug(cryptUtils.verifyServerSignature(nonce, sign));

// let encrypted = cryptUtils.rsaPrivateEncrypt('2333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333');
// logger.debug(encrypted);
// logger.debug(cryptUtils.rsaPublicDecrypt(encrypted));

let input = '2333333湿哒哒是否撒旦法撒旦法撒旦法33',
  key = cryptUtils.genHash('12312314'),
  encrypted = cryptUtils.aesEncrypt(input, key),
  decrypted = cryptUtils.aesDecrypt(encrypted, key);
logger.debug('key: ', key, ', encrypted: ', encrypted, ', decrypted: ', decrypted);