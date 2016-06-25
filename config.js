module.exports = {
  port: (process.env.PORT || 5000),
  accessLog: {
    path: __dirname + '/logs/access.log'
  }
};