import { describe, it, expect } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import addressRoutes from '../../src/routes/address.routes.js';
import tokenService from '../../src/services/tokenService.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/addresses', addressRoutes);
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

// Misma técnica de introspección que tests/unit/user.routes.test.js: cada
// router.METHOD(path, ...) crea su propio Route+Layer con fn.name real, así que
// podemos comprobar la cadena de middleware exacta sin tocar Mongo.
function middlewareNames(method, path) {
  const layer = addressRoutes.stack.find((l) => l.route && l.route.path === path && l.route.methods[method]);
  expect(layer, `no se encontró la ruta ${method.toUpperCase()} ${path}`).toBeDefined();
  return layer.route.stack.map((s) => s.name);
}

const validAddressBody = {
  tipo: 'envio',
  titulo: 'Casa',
  calle: 'Calle Falsa',
  numero: '123',
  ciudad: 'Madrid',
  provincia: 'Madrid',
  codigoPostal: '28080',
  pais: 'España',
};

describe('routes/address.routes.js — wiring (middleware por ruta)', () => {
  it.each([
    ['get', '/', 'listAddresses'],
    ['post', '/', 'createAddress'],
    ['put', '/:id', 'updateAddress'],
    ['patch', '/:id/predeterminada', 'setDefaultAddress'],
  ])('%s %s pasa por requireAuth y termina en %s', (method, path, handlerName) => {
    const names = middlewareNames(method, path);
    expect(names).toContain('requireAuth');
    expect(names[names.length - 1]).toBe(handlerName);
  });

  it('POST / incluye validateAddressInput antes del controlador', () => {
    expect(middlewareNames('post', '/')).toContain('validateAddressInput');
  });

  it('PUT /:id incluye validateAddressInput antes del controlador', () => {
    expect(middlewareNames('put', '/:id')).toContain('validateAddressInput');
  });

  it('PATCH /:id/predeterminada NO requiere validateAddressInput', () => {
    expect(middlewareNames('patch', '/:id/predeterminada')).not.toContain('validateAddressInput');
  });
});

describe('routes/address.routes.js — ejecución real de requireAuth y validateAddressInput (sin BD)', () => {
  it('cada endpoint devuelve 401 sin cookie de sesión', async () => {
    const app = buildApp();

    const responses = await Promise.all([
      request(app).get('/api/addresses'),
      request(app).post('/api/addresses').send(validAddressBody),
      request(app).put('/api/addresses/abc').send(validAddressBody),
      request(app).patch('/api/addresses/abc/predeterminada'),
    ]);

    for (const res of responses) {
      expect(res.status).toBe(401);
    }
  });

  it('POST / rechaza con 400 si falta un campo obligatorio', async () => {
    const app = buildApp();
    const { titulo, ...sinTitulo } = validAddressBody;

    const res = await request(app).post('/api/addresses').set('Cookie', authCookie()).send(sinTitulo);

    expect(res.status).toBe(400);
  });

  it('PUT /:id rechaza con 400 si tipo no es "envio" ni "facturacion"', async () => {
    const app = buildApp();

    const res = await request(app)
      .put('/api/addresses/abc')
      .set('Cookie', authCookie())
      .send({ ...validAddressBody, tipo: 'otro' });

    expect(res.status).toBe(400);
  });
});
