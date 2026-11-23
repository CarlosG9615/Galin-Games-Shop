import { describe, it, expect } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import mongoose from 'mongoose';
import gameRoutes from '../../src/routes/game.routes.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/games', gameRoutes);
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ code: err.status || 500, message: err.message });
  });
  return app;
}

// Misma técnica de introspección que tests/unit/address.routes.test.js.
function middlewareNames(method, path) {
  const layer = gameRoutes.stack.find((l) => l.route && l.route.path === path && l.route.methods[method]);
  expect(layer, `no se encontró la ruta ${method.toUpperCase()} ${path}`).toBeDefined();
  return layer.route.stack.map((s) => s.name);
}

describe('routes/game.routes.js — wiring (middleware por ruta)', () => {
  it.each([
    ['get', '/destacados', 'listDestacados'],
    ['get', '/plataforma/:plataforma', 'listPorPlataforma'],
    ['get', '/:id', 'getDetalle'],
    ['post', '/:id/notificarme', 'suscribirNotificacion'],
  ])('%s %s termina en %s', (method, path, handlerName) => {
    const names = middlewareNames(method, path);
    expect(names[names.length - 1]).toBe(handlerName);
  });

  it('GET /destacados, /plataforma/:plataforma y /:id son públicas (sin requireAuth)', () => {
    expect(middlewareNames('get', '/destacados')).not.toContain('requireAuth');
    expect(middlewareNames('get', '/plataforma/:plataforma')).not.toContain('requireAuth');
    expect(middlewareNames('get', '/:id')).not.toContain('requireAuth');
  });

  it('POST /:id/notificarme requiere requireAuth (Requisito 15.4)', () => {
    expect(middlewareNames('post', '/:id/notificarme')).toContain('requireAuth');
  });
});

describe('routes/game.routes.js — ejecución real (sin BD)', () => {
  it('GET /plataforma/:plataforma no exige sesión: una plataforma inválida da 404, no 401', async () => {
    // resolvePlatform devuelve null antes de tocar el modelo Game, así que este caso
    // no depende de una conexión a Mongo activa (a diferencia de un slug válido).
    const app = buildApp();
    const res = await request(app).get('/api/games/plataforma/switch');
    expect(res.status).toBe(404);
  });

  it('POST /:id/notificarme devuelve 401 sin cookie de sesión', async () => {
    const app = buildApp();
    const id = new mongoose.Types.ObjectId().toString();
    const res = await request(app).post(`/api/games/${id}/notificarme`).send({ plataforma: 'PC' });
    expect(res.status).toBe(401);
  });
});
