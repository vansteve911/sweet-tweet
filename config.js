module.exports = {
	port: (process.env.PORT || 5000),
	socketPort: (process.env.SOCKET_IO_PORT || 5001),
	accessLog: {
		path: __dirname + '/logs/access.log'
	},
	upload: {
		accessKey: 'aGd6tKKpFEzizLNcqIoXfWqN1aMn03kuVM0d6KxP',
		secretKey: 'hMx5vhtmoFiWAoixuNSc6jxSKiLhBOBAOcVEuABI',
		bucketName: 'vansteve911-com',
		keyPrefix: 'swts/',
		host: 'http://7xrybw.com1.z0.glb.clouddn.com/'
	},
	postgre: {
		user: process.env.PGUSER || 'dbuser', //env var: PGUSER
		database: process.env.PGDATABASE || 'testdb', //env var: PGDATABASE
		password: process.env.PGPASSWORD || '123456', //env var: PGPASSWORD
		port: process.env.PGPORT || 5432, //env var: PGPORT
		max: 10, // max number of clients in the pool
		idleTimeoutMillis: 1000, // how long a client is allowed to remain idle before being closed
	},
	redis: {
		host: '127.0.0.1',
		port: 6379,
		idleTimeout: 3000, // custom config
		retry_strategy: function(options) {
			if (options.error.code === 'ECONNREFUSED') {
				// End reconnecting on a specific error and flush all commands with a individual error
				return new Error('The server refused the connection');
			}
			if (options.total_retry_time > 1000 * 60 * 60) {
				// End reconnecting after a specific timeout and flush all commands with a individual error
				return new Error('Retry time exhausted');
			}
			if (options.times_connected > 10) {
				// End reconnecting with built in error
				return undefined;
			}
			// reconnect after
			return Math.max(options.attempt * 100, 3000);
		}
	},
	security: {
		passwordKey: __dirname + '/keys/password.pem',
		serverKey: __dirname + '/keys/server.key',
		clientKey: __dirname + '/keys/client.key',
		clientCert: __dirname + '/keys/client.pem'
	}
};