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
	if (req.user) {
		apiResult(res, req.user);
	} else {
		apiResult(res, null, new ApiError('user not login', ErrorCode.UNAUTHORIZED));
	}
});

router.get('/:id', function(req, res) {
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

module.exports = router;