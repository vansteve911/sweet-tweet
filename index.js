var config = require('./config.js');

var express = require('express');
var morgan = require('morgan');
var fs = require('fs');
var bodyParser = require('body-parser');

var logger = require('./logger.js');

require('./errorHandler.js');

var app = express();
// app.use(logger);

// config static file
app.use(express.static(__dirname + '/static'));

var accessLogStream = fs.createWriteStream(config.logger.accessLogPath, {flags: 'a'});

// add default middlewares
app.use(morgan('combined', {stream : accessLogStream}));

// config route
app.get('/', function(request, response) {
  logger.info('hehehe!');
  response.send('Hello World!');
});

app.listen(config.port, function() {
  console.log('Node app is running on port', config.port);
});