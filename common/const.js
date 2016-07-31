module.exports = {
	cachePrefix: {
		tweet: {
			tweet: 'tw_',
			tweetIdList: 'twil_'
		},
		user: {
			user: 'u_'
		},
    chat: {
      userChannel: 'ch_uc_', // k-v
      notifyChannel: 'ch_nc_',
      channelMsgQueue: 'ch_cmq_', // FIFO
      offlineClientQueue: 'ch_ocq_', // LRU
      offlineUserMsgQueue: 'ch_oumq_' // FIFO
    }
	},
  chat:{
    socketStatus: {
      CONNECTED: 0,
      AUTH_SENT: 1,
      CLIENT_AUTH: 2,
      SERVER_AUTH: 3,
      ESTABLISHED: 4
    },
    socketEvent:{
      CONNECTION: 'connection',
      AUTH_REQ: 'auth-req', // s->c, c->s
      CONNECT_ERROR: 'connect_error',
      AUTH_RES: 'auth-res', // s->c
      SESS_KEY: 'sess-key',
      SESS_START: 'sess-start',
      MSG: 'msg',
      FEEDBACK: 'feedback',
      DISCONNECT: 'disconnect',
      CLIENT_ERROR: 'client_error',
    },
    chatEvent: {
      INIT: 'init',
      ONLINE: 'online',
      RECV: 'recv',
      SEND: 'send',
      OFFLINE: 'offline',
      QUIT: 'quit'
    },
    feedback: {
      UNKNOWN: 0,
      SEND_SUCCESS: 1,
      SEND_FAIL: 2
    }
  }
}