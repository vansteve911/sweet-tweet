'use strict';
const logger = require('../logger'),
	cryptUtils = require('../utils/cryptUtils'),
	uuid = require('node-uuid');


module.exports.genSessKeyFactor = function() {
	return cryptUtils.genRnd();
}

module.exports.genServerAuthData = function(input) {
	return genAuthData(input, true);
}

module.exports.genClientAuthData = function(input) {
	return genAuthData(input, false);
}

function genAuthData(input, byServer) {
	try {
		let data = byServer ? cryptUtils.rsaPrivateEncrypt(input) : cryptUtils.rsaPublicEncrypt(input),
			nonce = cryptUtils.genNonce(),
			ret = {
				data: data,
				nonce: nonce
			},
			originStr = cryptUtils.convertToOriginalStr({
				data: data,
				nonce: nonce
			});
		ret.sign = byServer ? cryptUtils.genServerSignature(originStr) : cryptUtils.genDigest(originStr);
		return ret;
	} catch (err) {
		logger.error('failed to genAuthData!');
		logger.error(err);
	}
	return null;
}

module.exports.decryptClientAuthData = function(data) {
	return decryptAuthData(data, true);
}

module.exports.decryptServerAuthData = function(data) {
	return decryptAuthData(data, false);
}

function decryptAuthData(data, byServer) {
	if (!data || !data.data || !data.nonce || (!byServer && !data.sign)) {
		logger.warn('empty client data: ', data);
		return null;
	}
	try {
		let sign = data.sign;
		delete data.sign;
		let originStr = cryptUtils.convertToOriginalStr(data);
		if ((byServer && cryptUtils.verifyDigest(originStr, sign)) ||
			(!byServer && cryptUtils.verifyServerSignature(originStr, sign))) {
			let decrypted = byServer ? cryptUtils.rsaPrivateDecrypt(data.data) : cryptUtils.rsaPublicDecrypt(data.data);
			logger.debug('decrypted: ', decrypted);
			return decrypted;
		} else {
			logger.warn('unmatched sign and data, sign: ', sign, ', originStr: ', originStr);
		}
	} catch (err) {
		logger.error('failed to decryptAuthData!');
		logger.error(err);
	}
	return null;
}


module.exports.genSessKey = function(f1, f2) {
	if (f1 && typeof f1 === 'string' && f2 && typeof f2 === 'string') {
		return cryptUtils.genHash(f1 + '&' + f2);
	}
	return null;
}

module.exports.encryptSessMsg = function(msg, sessKey) {
	// msg content is text in special format; specific html tags are supported.
	if (msg) {
		if (typeof msg === 'object' && msg.body && typeof msg.body === 'string') {

		} else if (typeof msg === 'string') {
			msg = {
				body: msg
			}
		} else {
			logger.warn('invalid msg format: ', msg);
			return null;
		}
		try {
			return cryptUtils.aesEncrypt(JSON.stringify(msg), sessKey);
		} catch (err) {
			logger.error('failed to encryptSessMsg! msg: ' + msg);
			logger.error(err);
		}
	}
	return null;
}

module.exports.decryptSessMsg = function(encrypted, sessKey) {
	if (encrypted) {
		let decrypted = cryptUtils.aesDecrypt(encrypted, sessKey);
		if (decrypted) {
			try {
				return JSON.parse(decrypted);
			} catch (err) {
				logger.error('failed to decryptSessMsg! decrypted: ' + decrypted);
				logger.error(err);
			}
		}
	}
	return null;
}

module.exports.parseSessMsg = function(data) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (err) {
      logger.error('failed to parseSessMsg! data: ' + data);
      logger.error(err);
      data = null;
    }
  }
  return data;
}

module.exports.genChatNodeId = function(){
	return uuid.v1();
}