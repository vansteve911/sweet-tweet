'use strict';
const logger = require('./logger');

function apiResult(res, data, err) {
	let message = '',
		code = 200;
	if (err) {
		logger.error(err.message, err.stack);
		code = err.code || 500;
		message = err.message || '';
	}
	let ret = {
		code: code,
		message: message
	};
	if (data) {
		ret.data = data;
	}
	res.json(ret);
}

module.exports = apiResult;