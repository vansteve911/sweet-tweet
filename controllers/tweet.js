'use strict';
const router = require('express').Router(),
  apiResult = require('../apiResult.js'),
  ts = require('../services/tweetService');

router.get(['/list', '/'], function(req, res) {
  let score = req.param('score') || (new Date()).getTime(),
    count = req.param('count') || 10;
  ts.list(score, count)
    .then((data)=>{
      apiResult(res, data);      
    })
    .catch((err)=>{
      apiResult(res, null, err);
    });
});

router.get('/t/:id', function(req, res) {
  ts.get(req.params.id)
    .then((data)=>{
      apiResult(res, data);      
    })
    .catch((err)=>{
      apiResult(res, null, err);
    });
});

router.post('/t', function(req, res){
  let body = req.body || {};  
  ts.add(body)
    .then((data)=>{
      apiResult(res, data);
    })
    .catch((err)=>{
      apiResult(res, null, err);
    });
});


module.exports = router;