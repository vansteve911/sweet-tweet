module.exports = {
  port: (process.env.PORT || 5000),
  logger: {
    accessLogPath: __dirname + '/logs/access.log'
  }
};