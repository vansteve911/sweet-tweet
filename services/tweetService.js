'use strict';
const Tweet = require('../models/tweet'),
	t = new Tweet(),
	ApiError = require('../common/apiError'),
	errorCode = require('../common/errorCode');

function TweetService() {}

TweetService.prototype.list = function(score, count) {
	return new Promise((resolve, reject) => {
		t.getList(score, count)
			.then((list) => {
				let result = list.map(tweet => parseToView(tweet));
				resolve(result);
			})
			.catch(reject);
	});
}

TweetService.prototype.get = function(id) {
	return new Promise((resolve, reject) => {
		if (!parseInt(id)) {
			return reject(new ApiError('not exists!', errorCode.NOT_FOUND));
		}
		t.get(id)
			.then((data) => {
				if (data) {
					resolve(parseToView(data));
				} else {
					reject(new ApiError('not exists!', errorCode.NOT_FOUND));
				}
			})
			.catch(reject);
	})
}

TweetService.prototype.add = function(data) {
	return new Promise((resolve, reject) => {
		if (!data || !tweetTypes.some(x => x === data.type)) {
			return reject(new ApiError('wrong tweet type!', errorCode.BAD_REQUEST));
		} else if (!data.content || data.content.length === 0) {
			return reject(new ApiError('empty content!', errorCode.BAD_REQUEST));
		} else if (!(data.user_id = parseInt(data.user_id))) {
			return reject(new ApiError('invalid user_id!', errorCode.BAD_REQUEST));
		}
		let id = genTweetID(data);
		if (!id) {
			return reject(new ApiError('genID failed!', errorCode.BAD_REQUEST));
		}
		data.id = id;
		t.add(data)
			.then((data) => {
				resolve(parseToView(data))
			})
			.catch(reject);
	});
}

const tweetTypes = [
	0, // text
	1, // pic
	2, // video
	3 // sound
];

function genTweetID(tweet) {
	if (tweet && tweet.createTime && tweet.user_id) {
		return hashUtils.genID('tweet/' + tweet.createTime + '/' + tweet.user_id);
	}
	return null;
}

function parseToView(model) {
	if (model && model.config) {
		try {
			let config = JSON.parse(model.config);
			for (let k of Object.keys(config)) {
				model[k] = config[k];
			}
			delete model.config;
		} catch (err) {
			console.error(err);
		}
	}
	return model;
}

module.exports = new TweetService();