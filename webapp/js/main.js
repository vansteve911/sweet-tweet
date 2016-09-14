var Constants = {
  chat: {
    socketStatus: {
      CONNECTED: 0,
      AUTH_SENT: 1,
      CLIENT_AUTH: 2,
      SERVER_AUTH: 3,
      ESTABLISHED: 4
    },
    socketEvent: {
      CONNECTION: 'connection',
      CLIENT_CONNECT: 'connect',
      AUTH_REQ: 'auth-req', // s->c, c->s
      CONNECT_ERROR: 'connect_error',
      AUTH_RES: 'auth-res', // s->c
      SESS_KEY: 'sess-key',
      SESS_START: 'sess-start',
      MSG: 'msg',
      FEEDBACK: 'feedback',
      DISCONNECT: 'disconnect',
      CLIENT_ERROR: 'client_error'
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

var Emitter = function() {
  var self = this,
    emitter = document.createDocumentFragment();
  self.on = function(eventType, callback) {
    if (eventType && typeof eventType === 'string' && callback && typeof callback === 'function') {
      emitter.addEventListener(eventType, function(e) {
        callback(e.detail);
      }, false);
    } else {
      console.error('failed to add event listener, invalid eventType or callback function');
    }
  }
  self.emit = function(eventType, data) {
    if (eventType) {
      emitter.dispatchEvent(new CustomEvent(eventType.toString(), {
        detail: data
      }));
    } else {
      console.error('failed to emit, empty event');
    }
  }
}

var getFilePathName = function(path) {
  return path && (res = path.match(/[^\/\\]+.\w$/)) && res[0];
}

var http = function(args) {
  return new Promise((resolve, reject) => {
    if (args) {
      if (typeof args === 'string') {
        args = {
          url: args
        }
      }
      $.ajax(Object.assign(args, {
        success: (data)=> {
          resolve(data);
        },
        error: (err) => {
          reject(err);
        }
      }));
    }
  });
}

var httpPost = function(url, data) {
  return http({
    url: url,
    method: 'POST',
    data: data,
    contentType: 'application/json'
  });
}