var ChatClient = function(serverHost, opts) {
  var self = this,
    socket = undefined,
    reconnectTimer = undefined,
    SocketStatus = Constants.chat.socketStatus,
    SocketEvent = Constants.chat.socketEvent,
    ChatEvent = Constants.chat.chatEvent,
    Feedback = Constants.chat.feedback;

  opts = opts || {};
  var autoReconnect = opts.autoReconnect || true;

  // implements event emitter
  Object.assign(ChatClient.prototype, new Emitter());

  ChatClient.prototype.sendMsg = function(data) {
    if (!socket || !data) {
      return;
    }
    var msg = new Message(data);
    if (!checkSocketStatus(socket, SocketStatus.ESTABLISHED)) {
      return;
    }
    socket.emit(SocketEvent.MSG, msg);
    console.debug('message sent: ', msg);
  }

  ChatClient.prototype.disconnect = function() {
    if (!socket) {
      console.debug('connect not initialized');
      return;
    }
    console.debug('disconnecting...')
    socket.disconnect();
  }

  ChatClient.prototype.reconnect = function() {
    if (socket && socket.status === SocketStatus.CONNECTED) {
      console.debug('disconnect then reconnect');
      disconnect();
    }
    connect();
  }

  // online event handler
  self.on(ChatEvent.ONLINE, function() {
    console.debug('chat client session ESTABLISHED.');
  });

  connect();

  function connect() {
    socket = io(serverHost);
    console.debug('connected to ' + serverHost);
    socket.status = SocketStatus.CONNECTED;
    console.debug('client connected, wait for server auth resp.');

    if (reconnectTimer) {
      clearInterval(reconnectTimer);
    }
    // session-start handler
    socket.on(SocketEvent.SESS_START, function(data) {
      if (!checkSocketStatus(socket, SocketStatus.CONNECTED)) {
        return;
      }
      console.debug('user auth passed, session start. data: ', data);
      socket.status = SocketStatus.ESTABLISHED;
      // TODO output
      self.emit(ChatEvent.ONLINE, {});
    });

    // error handler
    socket.on(SocketEvent.CONNECT_ERROR, function(err) {
      console.error('connect error: ', err);
    });

    // disconnect handler
    socket.on(SocketEvent.DISCONNECT, function() {
      console.debug('disconnected.');
      self.emit(ChatEvent.OFFLINE);
      if (autoReconnect) {
        reconnectTimer = setInterval(function() {
          if(!self.reconnect()){
            console.debug('reconnect failed, will retry after 5 seconds');
          }
        }, 5000);
      }
    });

    // error handler
    socket.on(SocketEvent.CLIENT_ERROR, function(err) {
      console.error('client error: ' + err);
    });

    // msg handler
    socket.on(SocketEvent.MSG, function(data) {
      if (!checkSocketStatus(socket, SocketStatus.ESTABLISHED)) {
        return;
      }
      var msg = chatUtils.parseSessMsg(data);
      if (msg) {
        console.debug('received msg: ', msg);
      } else {
        console.debug('parse received data failed: ', data);
      }
      self.emit(ChatEvent.RECV, data);
    });

    return true;
  }

  socket.on(SocketEvent.FEEDBACK, function(feedback) {
    if (!checkSocketStatus(socket, SocketStatus.ESTABLISHED)) {
      return;
    }
    if (feedback) {
      console.debug('received server feedback: ', feedback);
      if (feedback === Feedback.SEND_SUCCESS) {
        console.debug('send message success.');
      } else {
        console.warn('send message failed: ', feedback);
      }
    } else {
      console.debug('empty feedback.');
    }
  });

  var chatUtils = {
    parseSessMsg: function(data) {
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (err) {
          console.error('failed to parseSessMsg! data: ' + data);
          console.error(err);
          data = null;
        }
      }
      return data;
    }
  };

  var Message = function(args) {
    var self = this;
    args = args || {};
    self.toUid = args.toUid || 0;
    self.body = args.body || '[系统消息]';
    self.note = args.note;
    self.extra = args.extra;
  };

  var checkSocketStatus = function(socket, rightStatus) {
    if (socket.status !== rightStatus) {
      console.error('wrong socket status: ', socket.status, ', should be ', rightStatus);
      socket.disconnect();
      return false;
    }
    return true;
  };
}