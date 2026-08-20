const crypto = require('crypto');
const { requireField } = require('../utils/nullGuard');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateVerificationToken() {
  const token = crypto.randomBytes(32).toString('base64url');
  const hash = hashToken(token);
  return { token, hash };
}

function verifyVerificationToken(tokenRecibido, hashAlmacenado) {
  requireField(tokenRecibido, 'tokenRecibido');
  requireField(hashAlmacenado, 'hashAlmacenado');

  return hashToken(tokenRecibido) === hashAlmacenado;
}

module.exports = { generateVerificationToken, verifyVerificationToken, hashVerificationToken: hashToken };
