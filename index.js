'use strict';

const express = require('express'),
  morgan = require('morgan'),
  fs = require('fs'),
  bodyParser = require('body-parser'),
  app = express(),
  config = require('./config'),
  logger = require('./logger'),
  ejs = require('ejs'),
  pageRouter = require('./controllers/page'),
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
app.use('/webapp', express.static('./webapp')); 
// access log
let accessLogStream = fs.createWriteStream(config.accessLog.path, {
  flags: 'a'
});
app.use(morgan('combined', {
  stream: accessLogStream
}));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/webapp/pages');

// config routers
// home
app.use('/', pageRouter);
// upload api
app.use('/api/auth', authRouter);
app.use('/api/tweet', tweetRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/user', userRouter);

// config error handlers
app.use(errorHandler.requestErrorHandler);

// chat server
let chatServer = require('http').Server(app),
  ChatService = require('./services/chatService'),
  chatService = new ChatService(chatServer);
let ChatManager = require('./services/chatManager'),
  chatManager = new ChatManager(chatService);

// start web server
// app.listen(config.port, function() {
//   logger.info('Node app is running on port ' + config.port);
// });

chatServer.listen(config.socketPort, function(){
  logger.info('chat server is running on port ' + config.socketPort);
});