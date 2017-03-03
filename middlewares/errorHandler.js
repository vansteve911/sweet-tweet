'use strict';
const logger = require('../logger');

// define request error handler
function requestErrorHandler(err, req, res, next) {
  logger.error('error occured', err);
  res.status(err.code)
  	.json({
	    'code': err.code,
	    'error': err.message
	  });
}

function uncaughtExceptionHandler(err){
  logger.error('Error caught in uncaughtException event:', err);
}

module.exports.requestErrorHandler = requestErrorHandler;
module.exports.uncaughtExceptionHandler = uncaughtExceptionHandler;
