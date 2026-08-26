const dotenv = require('dotenv');

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function loadEnv() {
  dotenv.config();

  const required = [
    'JWT_SECRET',
    'MONGODB_URI',
    'EMAIL_USER',
    'EMAIL_APP_PASSWORD',
    'FRONTEND_URL',
    'BACKEND_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];
  for (const key of required) {
    if (isBlank(process.env[key])) {
      console.error(`[FATAL] La variable de entorno ${key} es obligatoria`);
      process.exit(1);
      return null;
    }
  }

  if (process.env.JWT_SECRET.length < 32) {
    console.error('[FATAL] JWT_SECRET debe tener al menos 32 caracteres');
    process.exit(1);
    return null;
  }

  if (isBlank(process.env.REFRESH_TOKEN_SECRET) || process.env.REFRESH_TOKEN_SECRET.length < 32) {
    console.error('[FATAL] REFRESH_TOKEN_SECRET es obligatoria y debe tener al menos 32 caracteres');
    process.exit(1);
    return null;
  }

  const jwtExpiresIn = parseInt(process.env.JWT_EXPIRES_IN, 10) || 3600;
  if (jwtExpiresIn > 86400) {
    console.error('[FATAL] JWT_EXPIRES_IN no puede superar 86400 segundos (24 horas)');
    process.exit(1);
    return null;
  }

  return {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: jwtExpiresIn,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRES_DAYS: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 10) || 7,
    MONGODB_URI: process.env.MONGODB_URI,
    PORT: parseInt(process.env.PORT, 10) || 3001,
    NODE_ENV: process.env.NODE_ENV || 'development',
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
      : [],
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_APP_PASSWORD: process.env.EMAIL_APP_PASSWORD,
    FRONTEND_URL: process.env.FRONTEND_URL,
    BACKEND_URL: process.env.BACKEND_URL,
    EMAIL_VERIFICATION_EXPIRES_HOURS: parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_HOURS, 10) || 24,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  };
}

module.exports = loadEnv();
