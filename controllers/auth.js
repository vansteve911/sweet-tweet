'use strict';
const router = require('express').Router(),
	reqSession = require('../middlewares/session'),
	apiResult = require('../apiResult.js'),
	auth = require('../middlewares/auth'),
	authService = require('../services/authService');

router.all('/login', reqSession, function(req, res) {
	authService.login({
			account: req.param('account'),
			password: req.param('password')
		}, req, res)
		.then((data) => {
			apiResult(res, data);
		})
		.catch((err) => {
			apiResult(res, null, err);
		});
});

router.all('/logout', reqSession, auth.userSession, auth.userAuth, function(req, res) {
	authService.logout(req, res)
		.then((data) => {
			apiResult(res);
		})
		.catch((err) => {
			apiResult(res, null, err);
		});
});


module.exports = router;