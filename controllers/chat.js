'use strict';

const router = require('express').Router(),
  apiResult = require('../apiResult.js'),
  ApiError = require('../common/apiError'),
  ErrorCode = require('../common/ErrorCode'),
  sessionService = require('../services/chatSessionService'),
  reqSession = require('../middlewares/session'),
  auth = require('../middlewares/auth');

// my chat sessions
router.get('/sessions', reqSession, auth.userSession, auth.userAuth, function(req, res) {
  let uid = req.user.id,
   score = req.param('score') || 0,
   size = req.param('size') || 10;
  sessionService.getUserSessions(uid, score, size)
    .then((data) => {
      apiResult(res, data);
    })
    .catch((err) => {
      apiResult(res, null, err);
    });
});

router.get('/activeSession', reqSession, auth.userSession, auth.userAuth, function(req, res) {
  // invoke when entering a session, will set unread to 0

}