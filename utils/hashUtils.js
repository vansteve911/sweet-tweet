'use strict';
const crypto = require('crypto'),
	fs = require('fs'),
	config = require('../config'),
	PEM_KEY = fs.readFileSync(config.security.keyFile).toString('ascii');

module.exports.genID = function(str) {
	return parseInt(crypto.createHash('sha1').update(str).digest('hex').substr(0, 13), 16);
};
module.exports.encryptPassword = function(password) {
	let hmac = crypto.createHmac('sha1', PEM_KEY);
	return hmac.update(password).digest('hex');
}