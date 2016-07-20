'use strict';

const router = require('express').Router(),
  apiResult = require('../apiResult.js'),
  UserService = require('../services/userService.js'),
  us = new UserService();

// get
router.get('/u/:id', function(req, res){
	us.get(req.params.id)
	.then((data)=>{
      apiResult(res, data);      
    })
    .catch((err)=>{
      apiResult(res, null, err);
    });
});

router.get('/verify/nickname', function(req, res){
	let nickname = req.param('nickname');
	us.checkNickname(nickname)
	.then((data)=>{
      apiResult(res, data);      
    })
    .catch((err)=>{
      apiResult(res, null, err);
    });
});


// create
router.post('/u', function(req, res){
  let body = req.body || {};  
  us.create(body)
    .then((data)=>{
      apiResult(res, data);
    })
    .catch((err)=>{
      apiResult(res, null, err);
    });
});

// update
router.post('/u/:id', function(req, res){
	let id = req.params.id, 
		body = req.body || {};  
  us.update(id, body)
    .then((data)=>{
      apiResult(res, data);
    })
    .catch((err)=>{
      apiResult(res, null, err);
    });
});

module.exports = router;