const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const DUPLICATE_FIELD_MESSAGES = {
  username: 'El nombre de usuario ya está en uso',
  email: 'El email ya está en uso',
};

function resolveError(err) {
  if (err instanceof AppError) {
    return { status: err.status, message: err.message };
  }

  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return { status: 400, message: 'Solicitud inválida' };
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    return { status: 409, message: DUPLICATE_FIELD_MESSAGES[field] || 'El recurso ya existe' };
  }

  if (err instanceof jwt.TokenExpiredError) {
    return { status: 401, message: 'El token ha expirado' };
  }

  if (err instanceof jwt.JsonWebTokenError) {
    return { status: 401, message: 'Token inválido' };
  }

  return { status: 500, message: 'Error interno del servidor' };
}

// eslint-disable-next-line no-unused-vars
function globalErrorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err.stack);

  const { status, message } = resolveError(err);

  res.status(status).json({ code: status, message });
}

module.exports = globalErrorHandler;
