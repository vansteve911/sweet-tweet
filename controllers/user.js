'use strict';

const router = require('express').Router(),
	apiResult = require('../apiResult.js'),
	ApiError = require('../common/apiError'),
	ErrorCode = require('../common/ErrorCode'),
	us = require('../services/userService.js'),
	reqSession = require('../middlewares/session'),
	auth = require('../middlewares/auth');

// get
router.get('/me', reqSession, auth.userSession, auth.userAuth, function(req, res) {
	apiResult(res, req.user);
});

router.get('/info/:id', function(req, res) {
	us.get(req.params.id)
		.then((data) => {
			apiResult(res, data);
		})
		.catch((err) => {
			apiResult(res, null, err);
		});
});

router.get('/verify/nickname', function(req, res) {
	let nickname = req.param('nickname');
	us.checkNickname(nickname)
		.then((data) => {
			apiResult(res, data);
		})
		.catch((err) => {
			apiResult(res, null, err);
		});
});

// create
router.post('', function(req, res) {
	let body = req.body || {};
	us.create(body)
		.then((data) => {
			apiResult(res, data);
		})
		.catch((err) => {
			apiResult(res, null, err);
		});
});

// update
router.post('/me', reqSession, auth.userSession, auth.userAuth, function(req, res) {
	let id = req && req.user && req.user.id,
		body = req.body || {};
	us.update(id, body)
		.then((data) => {
			apiResult(res, data);
		})
		.catch((err) => {
			apiResult(res, null, err);
		});
});

router.get('/search', function(req, res) {
	let nickname = req.param('nickname'),
		pageSize = req.param('pageSize') || 10,
		pageNo = req.param('pageNo') || 1;
	console.debug('into search');

	us.search(nickname, pageSize, pageNo)
		.then((data)=>{
			apiResult(res, data);
		})
		.catch((err) => {
			apiResult(res, null, err);
		});
})

module.exports = router;