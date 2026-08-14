const AppError = require('./AppError');

function isEmpty(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

function requireField(value, fieldName) {
  if (isEmpty(value)) {
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
