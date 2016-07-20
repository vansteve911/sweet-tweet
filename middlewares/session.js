'use strict';
const session = require('express-session'),
  // SessionStore = require('connect-redis')(session);
  SessionStore = require('../storage/sessionStore')(session);

module.exports = session({
  store: new SessionStore(),
  secret: 'sw-tw-scrt'
})
