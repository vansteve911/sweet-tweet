var express = require('express');
var router = express.Router();

router.get('/', function(req, res){
  res.json({code: 200, message: 'ok'});
});

module.exports = router;