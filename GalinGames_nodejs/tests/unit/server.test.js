import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server.js';

// server.js exporta `app` sin arrancar el servidor ni conectar a Mongo cuando se
// requiere como módulo (`require.main !== module`), así que estos tests no tocan BD:
// requireAuth responde 401 antes de llegar a ningún controlador.
describe('server.js — wiring de mi-cuenta (Tarea 18)', () => {
  it('monta /api/users (requireAuth activo: 401 sin cookie de sesión)', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('monta /api/addresses (requireAuth activo: 401 sin cookie de sesión)', async () => {
    const res = await request(app).get('/api/addresses');
    expect(res.status).toBe(401);
  });

  it('el preflight CORS anuncia PUT, PATCH y DELETE además de GET/POST', async () => {
    const res = await request(app)
      .options('/api/users/me')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'PATCH');

    const allowed = (res.headers['access-control-allow-methods'] || '').split(',').map((m) => m.trim());
    expect(allowed).toEqual(expect.arrayContaining(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']));
  });
});
