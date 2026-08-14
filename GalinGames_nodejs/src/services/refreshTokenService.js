const crypto = require('crypto');
const { requireField } = require('../utils/nullGuard');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateRefreshToken() {
  const token = crypto.randomBytes(64).toString('base64url');
  const hash = hashToken(token);
  return { token, hash };
}

function verifyRefreshToken(tokenRecibido, hashAlmacenado) {
  requireField(tokenRecibido, 'tokenRecibido');
  requireField(hashAlmacenado, 'hashAlmacenado');

  return hashToken(tokenRecibido) === hashAlmacenado;
}

module.exports = { generateRefreshToken, verifyRefreshToken };
