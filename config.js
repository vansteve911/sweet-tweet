module.exports = {
  port: (process.env.PORT || 5000),
  accessLog: {
    path: __dirname + '/logs/access.log'
  },
  upload: {
    bucketName: 'vansteve911-com',
    keyPrefix: 'swts/'
  },
  postgre: {
    user: process.env.PGUSER || 'dbuser', //env var: PGUSER
    database: process.env.PGDATABASE || 'testdb', //env var: PGDATABASE
    password: process.env.PGPASSWORD || '123456', //env var: PGPASSWORD
    port: process.env.PGPORT || 5432, //env var: PGPORT
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 1000, // how long a client is allowed to remain idle before being closed
  }
};