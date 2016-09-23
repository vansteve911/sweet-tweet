'use strict';

const router = require('express').Router(),
  apiResult = require('../apiResult.js'),
  ApiError = require('../common/apiError'),
  ErrorCode = require('../common/ErrorCode'),
  sessionService = require('../services/chatSessionService'),
  reqSession = require('../middlewares/session'),
  auth = require('../middlewares/auth'),
  buildListWithScore = require('../apiResult.js').buildListWithScore;

// my chat sessions
router.get('/sessions', reqSession, auth.userSession, auth.userAuth, function(req, res) {
  let uid = req.user.id,
   score = req.param('score') || 0,
   size = req.param('size') || 10;
  // fetch one more record to judge if has next 
  sessionService.getUserSessions(uid, score, size + 1)
    .then((data) => {
      apiResult(res, buildListWithScore(data, 'update_time', size, true));
    })
    .catch((err) => {
      apiResult(res, null, err);
    });
});

// invoke when entering a session, will set unread to 0
router.get('/activeSession', reqSession, auth.userSession, auth.userAuth, function(req, res) {
  let uid = req.user.id,
    toUid = req.param('toUid');
  sessionService.updateUnreadCnt(uid, toUid, 0)
    .then((data) => {
      apiResult(res, data);
    })
    .catch((err) => {
      apiResult(res, null, err);
    });
});

module.exports = router;