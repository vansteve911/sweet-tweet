var config = {
  type: 'console',
  level: 'INFO',
  configure: {
    appenders: [
      { 
        type: 'console' // 控制台输出
      },
      {
        type: 'file', //文件输出
        filename: __dirname + '/logs/stdout.log',
        maxLogSize: 1024,
        backups:3,
        category: 'normal' 
      },
    ],
    replaceConsole: true,
  }
};
var log4js = require('log4js');
var logger = log4js.getLogger(config.type);
logger.setLevel(config.level);
log4js.configure(config.configure);

module.exports = logger;
