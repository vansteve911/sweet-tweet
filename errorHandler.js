'use strict';
// define request error handler
function requestErrorHandler(err, req, res, next) {
  console.error('error occured', err);
  res.status(500);
  res.json({
    'code': 500,
    'error': err.message
  });
}

function uncaughtExceptionHandler(err){
  console.error('Error caught in uncaughtException event:', err);
}

module.exports.requestErrorHandler = requestErrorHandler;
module.exports.uncaughtExceptionHandler = uncaughtExceptionHandler;
