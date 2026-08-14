const jwt = require('jsonwebtoken');
const tokenService = require('../services/tokenService');

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return res.status(401).json({ code: 401, message: 'No autorizado' });
  }

  try {
    req.user = tokenService.verifyToken(token);
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ code: 401, message: 'El token ha expirado' });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ code: 401, message: 'Token inválido' });
    }
    return next(err);
  }
}

module.exports = { requireAuth };
