'use strict';

const express = require('express'),
  morgan = require('morgan'),
  fs = require('fs'),
  bodyParser = require('body-parser'),
  app = express(),
  config = require('./config'),
  logger = require('./logger'),
  authRouter = require('./controllers/auth'),
  tweetRouter = require('./controllers/tweet'),
  uploadRouter = require('./controllers/upload'),
  userRouter = require('./controllers/user'),
  errorHandler = require('./middlewares/errorHandler');

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
app.use('/api/auth', authRouter);
app.use('/api/tweet', tweetRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/user', userRouter);

// config error handlers
app.use(errorHandler.requestErrorHandler);

// start server
app.listen(config.port, function() {
  console.log('Node app is running on port', config.port);
});