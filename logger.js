'use strict';
const config = {
  type: 'console',
  configure: {
    appenders: [
      { 
        type: 'console', // 控制台输出
        level: 'DEBUG',
      },
      {
        type: 'file', //文件输出
        level: 'INFO',
        filename: __dirname + '/logs/stdout.log',
        maxLogSize: 1024,
        backups:3,
        category: 'normal' 
      },
    ],
    replaceConsole: true,
  }
};
const log4js = require('log4js'),
  log4jsExtend = require('log4js-extend');

log4jsExtend(log4js, {
  format: '[@file:@line]'
})  

const logger = log4js.getLogger(config.type);
logger.setLevel(config.level);
log4js.configure(config.configure);

module.exports = logger;
