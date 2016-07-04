module.exports = {
  port: (process.env.PORT || 5000),
  accessLog: {
    path: __dirname + '/logs/access.log'
  },
  upload: {
    bucketName: 'vansteve911-com',
    keyPrefix: 'swts/'
  }
};