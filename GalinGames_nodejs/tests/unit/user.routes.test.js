import { describe, it, expect } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import userRoutes from '../../src/routes/user.routes.js';
import tokenService from '../../src/services/tokenService.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/users', userRoutes);
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ code: err.status || 500, message: err.message });
  });
  return app;
}

function authCookie() {
  const token = tokenService.generateToken('user-1', 'carlos');
  return [`token=${token}`];
}

// Introspección del router (en vez de disparar una petición real hasta el controlador,
// que necesitaría una conexión a Mongo): cada `router.METHOD(path, ...)` crea su propio
// Route+Layer con nombre de función real (fn.name), así que podemos comprobar la cadena
// de middleware exacta de cada ruta sin tocar la base de datos.
function middlewareNames(method, path) {
  const layer = userRoutes.stack.find((l) => l.route && l.route.path === path && l.route.methods[method]);
  expect(layer, `no se encontró la ruta ${method.toUpperCase()} ${path}`).toBeDefined();
  return layer.route.stack.map((s) => s.name);
}

describe('routes/user.routes.js — wiring (middleware por ruta)', () => {
  const protectedRoutes = [
    ['get', '/me', 'getMe'],
    ['patch', '/me', 'updateMe'],
    ['get', '/me/check-username', 'checkUsername'],
    ['post', '/me/avatar', 'uploadAvatar'],
    ['post', '/me/verify-password', 'verifyPassword'],
    ['put', '/me/email', 'requestEmailChange'],
    ['put', '/me/password', 'changePassword'],
    ['delete', '/me', 'deleteAccount'],
  ];

  it.each(protectedRoutes)('%s %s pasa por requireAuth y termina en %s', (method, path, handlerName) => {
    const names = middlewareNames(method, path);
    expect(names).toContain('requireAuth');
    expect(names[names.length - 1]).toBe(handlerName);
  });

  it('GET /verify-email-change no pasa por requireAuth y termina en confirmEmailChange', () => {
    const names = middlewareNames('get', '/verify-email-change');
    expect(names).not.toContain('requireAuth');
    expect(names[names.length - 1]).toBe('confirmEmailChange');
  });

  it('PATCH /me incluye validateUpdateProfileInput antes del controlador', () => {
    expect(middlewareNames('patch', '/me')).toContain('validateUpdateProfileInput');
  });

  it('PUT /me/password incluye validateChangePasswordInput antes del controlador', () => {
    expect(middlewareNames('put', '/me/password')).toContain('validateChangePasswordInput');
  });

  it('POST /me/avatar incluye handleAvatarUpload antes del controlador', () => {
    expect(middlewareNames('post', '/me/avatar')).toContain('handleAvatarUpload');
  });
});

describe('routes/user.routes.js — ejecución real de requireAuth y validadores (sin BD)', () => {
  it('cada endpoint protegido devuelve 401 sin cookie de sesión', async () => {
    const app = buildApp();

    const responses = await Promise.all([
      request(app).get('/api/users/me'),
      request(app).patch('/api/users/me').send({ nombre: 'X' }),
      request(app).get('/api/users/me/check-username?username=x'),
      request(app).post('/api/users/me/avatar'),
      request(app).post('/api/users/me/verify-password').send({ password: 'x', action: 'emailChange' }),
      request(app).put('/api/users/me/email').send({ password: 'x', newEmail: 'a@b.com' }),
      request(app)
        .put('/api/users/me/password')
        .send({ currentPassword: 'a', newPassword: 'bbbbbbbb', repeatNewPassword: 'bbbbbbbb' }),
      request(app).delete('/api/users/me').send({ password: 'x' }),
    ]);

    for (const res of responses) {
      expect(res.status).toBe(401);
    }
  });

  it('PATCH /me rechaza con 400 un body con un campo no permitido', async () => {
    const app = buildApp();

    const res = await request(app).patch('/api/users/me').set('Cookie', authCookie()).send({ email: 'otro@example.com' });

    expect(res.status).toBe(400);
  });

  it('PUT /me/password rechaza con 400 si las contraseñas no coinciden', async () => {
    const app = buildApp();

    const res = await request(app)
      .put('/api/users/me/password')
      .set('Cookie', authCookie())
      .send({ currentPassword: 'actual123', newPassword: 'nuevaPassword123', repeatNewPassword: 'otraDistinta123' });

    expect(res.status).toBe(400);
  });

  it('POST /me/avatar sin fichero adjunto rechaza con 400', async () => {
    const app = buildApp();

    const res = await request(app).post('/api/users/me/avatar').set('Cookie', authCookie()).field('otro', 'valor');

    expect(res.status).toBe(400);
  });
});
