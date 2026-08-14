const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { requireField } = require('../utils/nullGuard');

function generateToken(userId, username) {
  requireField(userId, 'userId');
  requireField(username, 'username');

  return jwt.sign({ userId, username }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

function verifyToken(token) {
  requireField(token, 'token');

  return jwt.verify(token, env.JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
