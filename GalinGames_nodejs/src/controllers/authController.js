const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const tokenService = require('../services/tokenService');
const refreshTokenService = require('../services/refreshTokenService');
const { requireField, AppError } = require('../utils/nullGuard');

const BCRYPT_COST = 12;

// Hash bcrypt fijo de una cadena arbitraria (no es una credencial real). Se usa como
// comparación señuelo cuando el username no existe, para que el tiempo de respuesta
// sea el mismo que cuando sí existe pero la password es incorrecta (mitiga timing attacks).
const DUMMY_HASH = '$2b$12$ubrl1CmUltJF85VfnclSGuYftreaEihZ7LzpF0znXtkg2zAZB4j/6';

const FAILED_ATTEMPTS_WINDOW_MS = 60_000;
const FAILED_ATTEMPTS_LIMIT = 5;
const BLOCK_DURATION_MS = 300_000;
const failedAttempts = new Map(); // username → { count, firstAttempt, blockedUntil }

const ACCESS_TOKEN_COOKIE_MAX_AGE_MS = 900 * 1000; // 15 minutos
const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

function uniformDelay() {
  const minMs = 200;
  const maxMs = 600;
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function isUsernameBlocked(username) {
  const record = failedAttempts.get(username);
  if (!record) return false;
  if (record.blockedUntil && Date.now() < record.blockedUntil) return true;
  if (Date.now() - record.firstAttempt > FAILED_ATTEMPTS_WINDOW_MS) {
    failedAttempts.delete(username);
    return false;
  }
  return false;
}

function recordFailedAttempt(username) {
  const now = Date.now();
  const record = failedAttempts.get(username);

  if (!record || now - record.firstAttempt > FAILED_ATTEMPTS_WINDOW_MS) {
    failedAttempts.set(username, { count: 1, firstAttempt: now, blockedUntil: null });
    return;
  }

  record.count += 1;
  if (record.count >= FAILED_ATTEMPTS_LIMIT) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
  }
}

function setAuthCookies(res, accessToken, refreshToken) {
  const secure = env.NODE_ENV === 'production';

  res.cookie('token', accessToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure,
    path: '/',
    maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure,
    path: '/api/auth/refresh',
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
  });
}

function clearAuthCookies(res) {
  res.clearCookie('token', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
}

async function login(req, res, next) {
  const { username, password } = req.body;

  try {
    requireField(username, 'username');
    requireField(password, 'password');

    if (isUsernameBlocked(username)) {
      const record = failedAttempts.get(username);
      const retryAfter = Math.max(0, Math.ceil((record.blockedUntil - Date.now()) / 1000));
      return res.status(429).json({
        message: 'Demasiados intentos fallidos. Inténtalo de nuevo más tarde.',
        retryAfter,
      });
    }

    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      recordFailedAttempt(username);
      await bcrypt.compare(password, DUMMY_HASH);
      await uniformDelay();
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      recordFailedAttempt(username);
      await uniformDelay();
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const accessToken = tokenService.generateToken(user._id.toString(), user.username);
    const { token: refreshToken, hash: refreshTokenHash } = refreshTokenService.generateRefreshToken();

    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      message: 'Login exitoso',
      userId: user._id.toString(),
      username: user.username,
    });
  } catch (err) {
    return next(err);
  }
}

async function register(req, res, next) {
  const { username, nombre, apellidos, email, password } = req.body;

  try {
    requireField(username, 'username');
    requireField(nombre, 'nombre');
    requireField(apellidos, 'apellidos');
    requireField(email, 'email');
    requireField(password, 'password');

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return next(new AppError('El nombre de usuario ya está en uso', 409));
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return next(new AppError('El email ya está en uso', 409));
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    const user = await User.create({ username, nombre, apellidos, email, password: passwordHash });

    return res.status(201).json({
      message: 'Usuario creado correctamente',
      userId: user._id.toString(),
    });
  } catch (err) {
    if (err.name === 'MongooseServerSelectionError') {
      return next(new AppError('Servicio temporalmente no disponible', 503));
    }
    // err.code === 11000 (clave duplicada, condición de carrera) lo resuelve el
    // globalErrorHandler a partir de err.keyPattern con el mismo mensaje por campo.
    return next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const receivedToken = req.cookies && req.cookies.refreshToken;

    if (!receivedToken) {
      return res.status(401).json({ message: 'Sesión expirada. Inicia sesión de nuevo.' });
    }

    const hash = refreshTokenService.hashRefreshToken(receivedToken);
    const user = await User.findOne({ refreshTokenHash: hash }).select('+refreshTokenHash');

    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Sesión expirada. Inicia sesión de nuevo.' });
    }

    const isValid = refreshTokenService.verifyRefreshToken(receivedToken, user.refreshTokenHash);

    if (!isValid) {
      user.refreshTokenHash = null;
      await user.save();
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Sesión expirada. Inicia sesión de nuevo.' });
    }

    const accessToken = tokenService.generateToken(user._id.toString(), user.username);
    const { token: newRefreshToken, hash: newRefreshTokenHash } = refreshTokenService.generateRefreshToken();

    user.refreshTokenHash = newRefreshTokenHash;
    await user.save();

    setAuthCookies(res, accessToken, newRefreshToken);

    return res.status(200).json({
      userId: user._id.toString(),
      username: user.username,
    });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    const accessToken = req.cookies && req.cookies.token;
    let userId = req.user && req.user.userId;

    if (!userId && accessToken) {
      const decoded = jwt.decode(accessToken);
      userId = decoded && decoded.userId;
    }

    // decoded sin verificar firma: nunca confiar en su tipo (evita inyección NoSQL
    // vía un payload forjado como { userId: { $ne: null } }).
    if (typeof userId === 'string' && userId) {
      await User.updateOne({ _id: userId }, { refreshTokenHash: null });
    }

    clearAuthCookies(res);

    return res.status(200).json({ message: 'Sesión cerrada correctamente' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { login, register, refresh, logout };
