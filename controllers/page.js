'use strict';
const router = require('express').Router(),
  logger = require('../logger'),
  reqSession = require('../middlewares/session'),
  auth = require('../middlewares/auth');

router.use(reqSession);

router.get('/', auth.userSession, (req, res) => {
  res.render('index', model({
    user: req.user
  }));
});

router.get('/login', auth.userSession, (req, res) => {
  res.render('login', model({
    isLogin: true
  }));
});

router.get('/signup', auth.userSession, (req, res) => {
  res.render('login', model({
    isLogin: false
  }));
});

router.get('/chat', auth.userSession, auth.pageUserAuth, (req, res) => {
  res.render('chatSessions', model({
    title: '聊天室'
  }));
});

function model(data, req) {
  data = data || {};
  return Object.assign({
    title: 'Sweet Tweet', // TODO
    user: req && req.user,
   }, data);
}

module.exports = router;