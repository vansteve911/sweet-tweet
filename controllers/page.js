'use strict';
const router = require('express').Router(),
  logger = require('../logger'),
  reqSession = require('../middlewares/session'),
  auth = require('../middlewares/auth');

router.use(reqSession);

router.get('/', auth.userSession, (req, res) => {
  renderIndex(req, res);
});

router.get('/login', auth.userSession, (req, res) => {
  // if (req.user) {
  //   renderIndex(req, res);
  //   return;
  // }
  res.render('login', model({
    isLogin: true
  }));
});

router.get('/signup', auth.userSession, (req, res) => {
  if (req.user) {
    renderIndex(req, res);
    return;
  }
  res.render('login', model({
    isLogin: false
  }));
});

router.get('/find', auth.userSession, auth.pageUserAuth, (req, res) => {
  res.render('searchUser', model({
    title: '找人聊天'
  }));
});

router.get('/chat/:uid', auth.userSession, auth.pageUserAuth, (req, res) => {
  res.render('chat', model({
    title: '聊天界面',
    user: req.user,
    toUserId: req.params.uid
  }));
});

function renderIndex(req, res) {
  res.render('index', model({
    user: req.user
  }));
};

function model(data, req) {
  data = data || {};
  return Object.assign({
    title: 'Sweet Tweet', // TODO
    user: req && req.user,
   }, data);
}

module.exports = router;