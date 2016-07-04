'use strict';

const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();

const config = require('./config.js');
const logger = require('./logger.js');
const uploadRouter = require('./routers/upload.js');

// config middlewares

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
  extended: true
}));
// static file 
app.use('/static', express.static('./static')); 
// access log
let accessLogStream = fs.createWriteStream(config.accessLog.path, {
  flags: 'a'
});
app.use(morgan('combined', {
  stream: accessLogStream
}));

// config routers
// home
app.get('/', function(request, response) {
  response.send('Hello World!');
});
// upload api
app.use('/api/upload', uploadRouter);

// config error handlers
const errorHandler = require('./errorHandler.js');
app.use(errorHandler.requestErrorHandler);

process.on('uncaughtException', function(err) {
  errorHandler.uncaughtExceptionHandler(err);
});

// start server
app.listen(config.port, function() {
  console.log('Node app is running on port', config.port);
});