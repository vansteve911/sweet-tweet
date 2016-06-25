var config = require('./config.js');

var express = require('express');
var morgan = require('morgan');
var fs = require('fs');
var bodyParser = require('body-parser');

var app = express();

// config loggers
// access log
var accessLogStream = fs.createWriteStream(config.accessLog.path, {flags: 'a'});
app.use(morgan('combined', {stream : accessLogStream}));
// stdout log
var logger = require('./logger.js');

// config static file
app.use('/static', express.static('./static'));

// config routers
var uploadRouter = require('./routers/upload.js');
app.use('/api/upload', uploadRouter);

app.get('/', function(request, response) {
  response.send('Hello World!');
});

app.listen(config.port, function() {
  console.log('Node app is running on port', config.port);
});

require('./errorHandler.js');