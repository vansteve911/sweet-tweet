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
	res.json(ret)
		.status(200);
}

function buildListWithScore(data, scoreAttrName, size, isScoreInDateFormat) {
	let list = (Array.isArray(data) && data) || [];
	scoreAttrName = (scoreAttrName || 'score').toString();
	size = Number(size) || 0;
	let retScore = -1,
		hasNext = false;
	if (list) {
		let lastOne = list[list.length - 1];
		if (lastOne) {
			retScore = (lastOne && lastOne[scoreAttrName]) || -1;
			if (isScoreInDateFormat) {
				retScore = Date.parse(retScore) || -1;
			}
		}
		hasNext = list.length > size;
	}
	return {
		list: list,
		score: retScore,
		hasNext: hasNext
	}
}

module.exports = apiResult;
module.exports.buildListWithScore = buildListWithScore;