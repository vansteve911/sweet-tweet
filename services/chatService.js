'use strict';
const socketIO = require('socket.io'),
	ApiError = require('../common/apiError'),
	ErrorCode = require('../common/errorCode'),
	logger = require('../logger'),
	chatUtils = require('../utils/chatUtils'),
	sessionMiddleware = require('../middlewares/session'),
	userSessionMiddleware = require('../middlewares/auth').userSession,
	userService = require('../services/userService');

const chatConst = require('../common/const').chat,
	SocketStatus = chatConst.socketStatus,
	SocketEvent = chatConst.socketEvent,
	ChatEvent = chatConst.chatEvent,
	Feedback = chatConst.feedback;

function disconnectOnError(socket, message, err) {
	console.error('socket shut down! ' + message);
	if (err) {
		socket.emit(SocketEvent.CONNECT_ERROR, err);
	}
	socket.disconnect();
}

function ChatService(appServer) {

	let self = this,
		io;

	init();

	function init() {
		io = require('socket.io')(appServer);
		self.id = chatUtils.genChatNodeId();
		logger.debug('start chat service!');
		// 
		self.on(ChatEvent.SEND, (data) => {
			if (data && data.destSocketId && data.msg) {
				// check if session is established
				let destSocket = io.sockets.connected[data.destSocketId];
				if (destSocket && destSocket.status === SocketStatus.ESTABLISHED) {
					// encrypt in case of secure session
					let sentMsg;
					if (destSocket.encrypted && destSocket.sessKey) {
						logger.debug('encrypt msg before sending, msg: ', data.msg)
						sentMsg = chatUtils.encryptSessMsg(data.msg, destSocket.sessKey)
					} else {
						sentMsg = chatUtils.parseSessMsg(data.msg);
					}
					io.to(data.destSocketId).emit(SocketEvent.MSG, sentMsg);
					logger.debug('send msg to dest socket: ', data.destSocketId);
				} else {
					logger.warn('dest socket not established: ', data.destSocketId);
				}
			} else {
				logger.debug('dest socket or msg not defined')
			}
		});

		// register session middleware for socket-io
		io.use((socket, next) => {
			sessionMiddleware(socket.request, socket.request.res, next);
		});
		io.use((socket, next) => {
			userSessionMiddleware(socket.request, socket.request.res, next);
		});

		io.on('connection', (socket) => {
			let user;
			if (user = socket.request.user) {
				logger.debug('user chat service start!');
				// check user auth
				if (user) {
					logger.debug('user auth success, chat user: ', user);
					socket.user = user;
					// if encrypted is a must
					if (socket.handshake.query['secure']) {
						// encrypt process 
						socket.status = SocketStatus.CONNECTED;
						socket.encrypted = true;
						socket.sessKeyFactors = {};
						socket.emit(SocketEvent.AUTH_REQ, {});
						logger.debug('request for an encrypted session, auth-req sent.');
					} else {
						// process without encrypt
						socket.status = SocketStatus.ESTABLISHED;
						socket.encrypted = false;
						socket.emit('sess-start', {});
						logger.debug('session start, sess-start sent');

						// socketManager.online(user.id, socket);
						self.emit(ChatEvent.ONLINE, {
							uid: socket.user.id,
							sid: socket.id
						})
					}
				} else {
					disconnectOnError(socket, 'user auth failed, get user failed, userId: ' + userSession.userId, new ApiError('user not login', ErrorCode.UNAUTHORIZED));
				}
			} else {
				disconnectOnError(socket, 'user auth failed, empty userId', new ApiError('user not login', ErrorCode.UNAUTHORIZED));
			}

			// disconnect handler
			socket.on(SocketEvent.DISCONNECT, (socket) => {
				logger.debug('socket closed: ', socket);
				self.emit(ChatEvent.OFFLINE, {
					id: self.id
				});
			});

			// auth req handler
			socket.on(SocketEvent.AUTH_REQ, function(data) {
				logger.debug('client auth req: ', data);
				if (!checkSocketStatus(socket, SocketStatus.CONNECTED)) {
					return;
				}
				let f1 = chatUtils.decryptClientAuthData(data),
					f2 = chatUtils.genSessKeyFactor();
				if (f1) {
					socket.sessKeyFactors.f1 = f1;
					socket.sessKeyFactors.f2 = f2;
					let authData = chatUtils.genServerAuthData(f2);
					logger.debug('authData: ', authData);
					socket.emit(SocketEvent.AUTH_RES, authData);
					socket.status = SocketStatus.CLIENT_AUTH;
				} else {
					logger.error('client auth failed, data: ', data);
					socket.disconnect();
				}
			});

			// sess key handler
			socket.on(SocketEvent.SESS_KEY, function(data) {
				logger.debug('client sess-key req: ', data);
				if (!checkSocketStatus(socket, SocketStatus.CLIENT_AUTH)) {
					return;
				}
				if (!socket.sessKeyFactors || !socket.sessKeyFactors.f1 || !socket.sessKeyFactors.f2) {
					logger.error('empty sessKey factors: ', socket.sessKeyFactors);
					socket.disconnect();
					return;
				}
				let clientSessKey = chatUtils.decryptClientAuthData(data),
					serverSessKey = chatUtils.genSessKey(socket.sessKeyFactors.f1, socket.sessKeyFactors.f2);
				logger.debug('clientSessKey: ', clientSessKey, ', serverSessKey: ', serverSessKey);
				if (clientSessKey === serverSessKey) {
					logger.debug('auth success! sess key: ', serverSessKey);
					socket.status = SocketStatus.ESTABLISHED;
					socket.sessKey = serverSessKey;
					// TODO save user info: save session info from client, e.g. to user
					// emit message
					let msg = new Message({
							note: '已经接入了对话'
						}),
						sessMsg = chatUtils.encryptSessMsg(msg, serverSessKey);
					socket.emit(SocketEvent.MSG, sessMsg);
				} else {
					logger.error('sessKey not matched! clientSessKey: ', clientSessKey, ', serverSessKey: ', serverSessKey);
					socket.disconnect();
					return;
				}
			});

			// msg handler
			socket.on(SocketEvent.MSG, function(data) {
				if (!checkSocketStatus(socket, SocketStatus.ESTABLISHED)) {
					return;
				}
				let msg = socket.encrypted ? chatUtils.decryptSessMsg(data, socket.sessKey) : chatUtils.parseSessMsg(data);
				logger.debug('server received message: ', msg);
				let errMsg;
				if (!msg) {
					errMsg = 'parse msg failed';
				} else if (!msg.toUid) {
					logger.warn('toUid undefined')
					errMsg = 'toUid undefined';
				} else {
					logger.debug('emit feedback')
					// send feedback to client
					socket.emit(SocketEvent.FEEDBACK, Feedback.SEND_SUCCESS);
					// emit recv event
					self.emit(ChatEvent.RECV, msg);
					return;
				}
				socket.emit(SocketEvent.CLIENT_ERROR, errMsg);
			});
		});
	}

}

require('util').inherits(ChatService, require('events').EventEmitter);


function Message(args) {
	args = args || {};
	this.fromUid = args.fromUid || 0;
	this.toUid = args.toUid || 0;
	this.body = args.body || '[系统消息]';
	this.note = args.note;
	this.extra = args.extra;
	this.time = new Date();
}

function checkSocketStatus(socket, rightStatus, error) {
	if (socket.status !== rightStatus) {
		logger.error('wrong socket status: ', socket.status, ', should be ', rightStatus);
		logger.debug('e: ', error)
		if (error) {
			socket.emit(SocketEvent.CONNECT_ERROR, error);
		}
		socket.disconnect();
		return false;
	}
	return true;
}

module.exports = ChatService;