const AppError = require('./AppError');

function isEmpty(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

function requireField(value, fieldName) {
  // typeof !== 'string' también rechaza objetos/arrays (p.ej. operadores de
  // inyección NoSQL como { $ne: null } enviados como body JSON).
  if (isEmpty(value) || typeof value !== 'string') {
    throw new AppError(`Campo requerido ausente: ${fieldName}`, 400);
  }
}

function sanitizeResponse(obj) {
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

module.exports = { requireField, isEmpty, sanitizeResponse, AppError };
