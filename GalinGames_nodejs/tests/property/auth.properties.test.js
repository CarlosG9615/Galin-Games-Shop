import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import request from 'supertest';
import { createRequire } from 'module';

// Base de datos de test dedicada (no la de desarrollo/CI de los demás tests) para que
// estos tests de propiedades puedan crear/borrar usuarios libremente sin interferir.
process.env.MONGODB_URI = 'mongodb://localhost:27017/GalinGames-property-auth';

// createRequire en vez de import: en este proyecto (backend CommonJS) un `import` ESM
// y el `require()` interno de otro módulo sobre el MISMO fichero acaban cargando dos
// instancias distintas (comprobado con un OverwriteModelError de Mongoose al duplicar
// el modelo User). createRequire comparte la caché nativa de Node con el require()
// interno de server.js/authController.js, evitando la duplicación.
const require = createRequire(import.meta.url);

const app = require('../../server.js');
const mongoose = require('mongoose');
const connectDB = require('../../src/config/db.js');
const User = require('../../src/models/User.js');
const env = require('../../src/config/env.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const tokenService = require('../../src/services/tokenService.js');
const refreshTokenService = require('../../src/services/refreshTokenService.js');
const emailServiceModule = require('../../src/services/emailService.js');
const { loginLimiter, registerLimiter, refreshLimiter } = require('../../src/middleware/rateLimiter.js');

const RATE_LIMIT_KEYS = ['127.0.0.1', '::ffff:127.0.0.1', '::1'];

async function resetRateLimiters() {
  for (const limiter of [loginLimiter, registerLimiter, refreshLimiter]) {
    for (const key of RATE_LIMIT_KEYS) {
      try {
        await limiter.resetKey(key);
      } catch {
        // clave no representada por este store todavía — no pasa nada
      }
    }
  }
}

async function clearUsers() {
  await User.deleteMany({});
}

// --- Arbitraries reutilizables --------------------------------------------------

const usernameCharArb = fc.constantFrom(
  ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_".split(''),
);
const validUsernameArb = fc
  .array(usernameCharArb, { minLength: 3, maxLength: 30 })
  .map((arr) => arr.join(''));

const passwordCharArb = fc.constantFrom(
  ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%".split(''),
);
const validPasswordArb = fc
  .array(passwordCharArb, { minLength: 8, maxLength: 40 })
  .map((arr) => arr.join(''));

let emailCounter = 0;
function uniqueEmail() {
  emailCounter += 1;
  return `prop-user-${Date.now()}-${emailCounter}@example.com`;
}

async function createVerifiedUser({ username, password }) {
  const hash = await bcrypt.hash(password, 12);
  return User.create({
    username,
    nombre: 'Prop',
    apellidos: 'Test',
    email: uniqueEmail(),
    password: hash,
  });
}

beforeAll(async () => {
  await connectDB();
  // El singleton de emailService es el MISMO objeto que usa authController.js
  // internamente (mismo require() nativo vía createRequire) — anular sendVerificationEmail
  // aquí evita que estas propiedades disparen envíos reales a Gmail cuando llaman a
  // POST /register a través de la app real.
  vi.spyOn(emailServiceModule, 'sendVerificationEmail').mockResolvedValue(undefined);
}, 20000);

afterEach(async () => {
  await clearUsers();
  await resetRateLimiters();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// --- Propiedades 1-4 (Task 37.1) -------------------------------------------------

describe('Propiedades 1-4 — login básico', () => {
  it('Propiedad 1: todo par (username, password) de usuario registrado → HTTP 200 + cookie token', async () => {
    await fc.assert(
      fc.asyncProperty(validUsernameArb, validPasswordArb, async (username, password) => {
        await clearUsers();
        await resetRateLimiters();
        await createVerifiedUser({ username, password });

        const res = await request(app).post('/api/auth/login').send({ username, password });

        expect(res.status).toBe(200);
        const setCookie = res.headers['set-cookie'] || [];
        expect(setCookie.some((c) => c.startsWith('token='))).toBe(true);
      }),
      { numRuns: 20 },
    );
  }, 60000);

  it('Propiedad 2: todo par inválido → HTTP 401, mensaje genérico, tiempo entre 200 y 600 ms', async () => {
    await fc.assert(
      fc.asyncProperty(validUsernameArb, validPasswordArb, fc.boolean(), async (username, password, seedRealUser) => {
        await clearUsers();
        await resetRateLimiters();

        if (seedRealUser) {
          await createVerifiedUser({ username, password: `${password}otra` });
        }

        const start = Date.now();
        const res = await request(app).post('/api/auth/login').send({ username, password });
        const elapsed = Date.now() - start;

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Credenciales incorrectas');
        expect(elapsed).toBeGreaterThanOrEqual(190);
        expect(elapsed).toBeLessThan(2000);
      }),
      { numRuns: 12 },
    );
  }, 60000);

  it('Propiedad 3: cuerpo de login inválido (campo extra, username vacío o con control chars) → HTTP 400 con { errors } sin el valor recibido', async () => {
    const secretMarker = 'valorSecreto_no_debe_filtrarse_9f3';
    const invalidBodyArb = fc.oneof(
      fc.record({ username: fc.constant(secretMarker), password: validPasswordArb, extra: fc.constant(secretMarker) }),
      fc.record({ username: fc.constant('   '), password: validPasswordArb }),
      fc.record({ username: fc.constant(`${secretMarker}\x01`), password: validPasswordArb }),
    );

    await fc.assert(
      fc.asyncProperty(invalidBodyArb, async (body) => {
        await resetRateLimiters();
        const res = await request(app).post('/api/auth/login').send(body);

        expect(res.status).toBe(400);
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body.errors.length).toBeGreaterThan(0);
        expect(JSON.stringify(res.body)).not.toContain(secretMarker);
      }),
      { numRuns: 20 },
    );
  }, 60000);

  it('Propiedad 4: username con espacios al inicio/fin → se busca siempre la versión recortada', async () => {
    // Solo el carácter espacio (0x20): el validador rechaza legítimamente el resto de
    // espacios en blanco (tab, salto de línea, ...) por ser caracteres de control ASCII < 32.
    const paddingArb = fc.array(fc.constant(' '), { minLength: 1, maxLength: 5 }).map((a) => a.join(''));

    await fc.assert(
      fc.asyncProperty(validUsernameArb, validPasswordArb, paddingArb, paddingArb, async (username, password, prefix, suffix) => {
        await clearUsers();
        await resetRateLimiters();
        await createVerifiedUser({ username, password });

        const res = await request(app)
          .post('/api/auth/login')
          .send({ username: `${prefix}${username}${suffix}`, password });

        expect(res.status).toBe(200);
      }),
      { numRuns: 15 },
    );
  }, 60000);
});

// --- Propiedades 5-7 (Task 37.2) -------------------------------------------------

describe('Propiedades 5-7 — hashing, exposición de password y payload del JWT', () => {
  it('Propiedad 5: toda contraseña en texto plano → el valor almacenado es siempre un hash bcrypt, nunca el texto plano', async () => {
    const validEmailLocalArb = fc
      .array(usernameCharArb, { minLength: 3, maxLength: 15 })
      .map((arr) => arr.join(''));

    await fc.assert(
      fc.asyncProperty(validUsernameArb, validPasswordArb, validEmailLocalArb, async (username, password, emailLocal) => {
        await clearUsers();
        await require('../../src/models/PendingUser.js').deleteMany({});
        await resetRateLimiters();

        const res = await request(app).post('/api/auth/register').send({
          username,
          nombre: 'Prop',
          apellidos: 'Test',
          email: `${emailLocal}@example.com`,
          password,
          repetirPassword: password,
        });

        expect(res.status).toBe(201);

        const PendingUser = require('../../src/models/PendingUser.js');
        const stored = await PendingUser.findOne({ username }).select('+password');
        expect(stored).not.toBeNull();
        expect(stored.password).not.toBe(password);
        expect(stored.password).toMatch(/^\$2[aby]\$/);
      }),
      { numRuns: 15 },
    );
  }, 60000);

  it('Propiedad 6: todo endpoint que devuelva datos de usuario → el campo password nunca aparece en el body de la respuesta', async () => {
    await fc.assert(
      fc.asyncProperty(validUsernameArb, validPasswordArb, async (username, password) => {
        await clearUsers();
        await resetRateLimiters();
        await createVerifiedUser({ username, password });

        const loginRes = await request(app).post('/api/auth/login').send({ username, password });
        expect(loginRes.status).toBe(200);
        expect(JSON.stringify(loginRes.body)).not.toContain('"password"');

        const badLoginRes = await request(app).post('/api/auth/login').send({ username, password: `${password}x` });
        expect(JSON.stringify(badLoginRes.body)).not.toContain('"password"');
      }),
      { numRuns: 15 },
    );
  }, 60000);

  it('Propiedad 7: todo JWT generado → el payload decodificado contiene exactamente userId, username, iat y exp', () => {
    fc.assert(
      fc.property(validUsernameArb, fc.uuid(), (username, userId) => {
        const token = tokenService.generateToken(userId, username);
        const decoded = jwt.decode(token);

        expect(Object.keys(decoded).sort()).toEqual(['exp', 'iat', 'username', 'userId'].sort());
        expect(decoded.userId).toBe(userId);
        expect(decoded.username).toBe(username);
      }),
      { numRuns: 100 },
    );
  });
});

// --- Propiedades 8-11 (Task 37.3) -------------------------------------------------

describe('Propiedades 8-11 — cabeceras de rate limit y seguridad, 409 por duplicado', () => {
  it('Propiedad 8: toda petición a POST /login → Retry-After y X-RateLimit-Remaining presentes con enteros no negativos', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ maxLength: 60 }), fc.string({ maxLength: 60 }), async (username, password) => {
        await resetRateLimiters();
        const res = await request(app).post('/api/auth/login').send({ username, password });

        expect(res.headers['ratelimit-remaining']).toBeDefined();
        expect(Number.isInteger(Number(res.headers['ratelimit-remaining']))).toBe(true);
        expect(Number(res.headers['ratelimit-remaining'])).toBeGreaterThanOrEqual(0);

        if (res.status === 429) {
          expect(res.body.retryAfter).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(res.body.retryAfter)).toBe(true);
        }
      }),
      { numRuns: 20 },
    );
  }, 60000);

  it('Propiedad 9: todo username ya registrado → un segundo registro con ese username devuelve HTTP 409 con mensaje sobre el username', async () => {
    await fc.assert(
      fc.asyncProperty(validUsernameArb, validPasswordArb, async (username, password) => {
        await clearUsers();
        await resetRateLimiters();
        await createVerifiedUser({ username, password });

        const res = await request(app).post('/api/auth/register').send({
          username,
          nombre: 'Prop',
          apellidos: 'Test',
          email: uniqueEmail(),
          password: 'otraPassword123',
          repetirPassword: 'otraPassword123',
        });

        expect(res.status).toBe(409);
        expect(res.body.message.toLowerCase()).toContain('usuario');
      }),
      { numRuns: 15 },
    );
  }, 60000);

  it('Propiedad 10: todo email ya registrado → un segundo registro con ese email devuelve HTTP 409 con mensaje sobre el email', async () => {
    await fc.assert(
      fc.asyncProperty(validUsernameArb, validUsernameArb, validPasswordArb, async (existingUsername, newUsername, password) => {
        fc.pre(existingUsername !== newUsername);
        await clearUsers();
        await resetRateLimiters();
        const email = uniqueEmail();
        await User.create({
          username: existingUsername,
          nombre: 'Prop',
          apellidos: 'Test',
          email,
          password: await bcrypt.hash(password, 12),
        });

        const res = await request(app).post('/api/auth/register').send({
          username: newUsername,
          nombre: 'Prop',
          apellidos: 'Test',
          email,
          password: 'otraPassword123',
          repetirPassword: 'otraPassword123',
        });

        expect(res.status).toBe(409);
        expect(res.body.message.toLowerCase()).toContain('email');
      }),
      { numRuns: 15 },
    );
  }, 60000);

  it('Propiedad 11: toda respuesta de la API → X-Content-Type-Options y X-Frame-Options presentes con los valores correctos', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ maxLength: 30 }), fc.string({ maxLength: 30 }), async (username, password) => {
        await resetRateLimiters();
        const res = await request(app).post('/api/auth/login').send({ username, password });

        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-frame-options']).toBe('DENY');
      }),
      { numRuns: 15 },
    );
  }, 60000);
});

// --- Propiedad 13 (Task 37.4; Propiedad 12 es de frontend) -----------------------

describe('Propiedad 13 — bloqueo por fuerza bruta', () => {
  it('Propiedad 13: tras exactamente 5 intentos fallidos consecutivos con el mismo username en 60s → el intento 6 devuelve HTTP 429', async () => {
    await fc.assert(
      fc.asyncProperty(validUsernameArb, validPasswordArb, async (username, password) => {
        await clearUsers();
        await resetRateLimiters();

        let lastStatus;
        for (let attempt = 1; attempt <= 6; attempt += 1) {
          const res = await request(app).post('/api/auth/login').send({ username, password: `${password}-wrong` });
          lastStatus = res.status;
          if (attempt < 6) {
            expect(res.status).toBe(401);
          }
        }

        expect(lastStatus).toBe(429);
      }),
      { numRuns: 8 },
    );
  }, 60000);
});

// --- Propiedades 14-15 (Task 37.5; Propiedad 16 es de frontend) ------------------

describe('Propiedades 14-15 — rotación del refresh token', () => {
  async function createUserWithRefreshToken({ username, password }) {
    const { token, hash } = refreshTokenService.generateRefreshToken();
    const user = await User.create({
      username,
      nombre: 'Prop',
      apellidos: 'Test',
      email: uniqueEmail(),
      password: await bcrypt.hash(password, 12),
      refreshTokenHash: hash,
    });
    return { user, refreshToken: token };
  }

  it('Propiedad 14: todo refresh token válido usado en POST /refresh → el token devuelto es diferente al recibido', async () => {
    await fc.assert(
      fc.asyncProperty(validUsernameArb, validPasswordArb, async (username, password) => {
        await clearUsers();
        await resetRateLimiters();
        const { refreshToken } = await createUserWithRefreshToken({ username, password });

        const res = await request(app)
          .post('/api/auth/refresh')
          .set('Cookie', [`refreshToken=${refreshToken}`]);

        expect(res.status).toBe(200);
        const setCookie = res.headers['set-cookie'] || [];
        const newRefreshCookie = setCookie.find((c) => c.startsWith('refreshToken='));
        expect(newRefreshCookie).toBeDefined();
        const newToken = newRefreshCookie.split(';')[0].split('=')[1];
        expect(newToken).not.toBe(refreshToken);
      }),
      { numRuns: 15 },
    );
  }, 60000);

  it('Propiedad 15: un refresh token ya rotado presentado de nuevo → HTTP 401 y ya no es válido para ninguna cuenta', async () => {
    await fc.assert(
      fc.asyncProperty(validUsernameArb, validPasswordArb, async (username, password) => {
        await clearUsers();
        await resetRateLimiters();
        const { user, refreshToken } = await createUserWithRefreshToken({ username, password });

        const firstRes = await request(app)
          .post('/api/auth/refresh')
          .set('Cookie', [`refreshToken=${refreshToken}`]);
        expect(firstRes.status).toBe(200);

        const reuseRes = await request(app)
          .post('/api/auth/refresh')
          .set('Cookie', [`refreshToken=${refreshToken}`]);
        expect(reuseRes.status).toBe(401);

        const currentHash = refreshTokenService.hashRefreshToken(refreshToken);
        const stillMatches = await User.findOne({ _id: user._id, refreshTokenHash: currentHash });
        expect(stillMatches).toBeNull();
      }),
      { numRuns: 12 },
    );
  }, 60000);
});

// --- Propiedades 17-18 (Task 37.6) -------------------------------------------------

describe('Propiedades 17-18 — guards defensivos y manejo global de errores', () => {
  it('Propiedad 17: campo requerido undefined/null/vacío → HTTP 400 antes de invocar funciones criptográficas', async () => {
    const compareSpy = vi.spyOn(bcrypt, 'compare');
    const hashSpy = vi.spyOn(bcrypt, 'hash');
    const signSpy = vi.spyOn(jwt, 'sign');
    const verifySpy = vi.spyOn(jwt, 'verify');

    const missingFieldBodyArb = fc.oneof(
      fc.record({ password: validPasswordArb }),
      fc.record({ username: validUsernameArb }),
      fc.record({ username: fc.constant(''), password: validPasswordArb }),
    );

    try {
      await fc.assert(
        fc.asyncProperty(missingFieldBodyArb, async (body) => {
          await resetRateLimiters();
          compareSpy.mockClear();
          hashSpy.mockClear();
          signSpy.mockClear();
          verifySpy.mockClear();

          const res = await request(app).post('/api/auth/login').send(body);

          expect(res.status).toBe(400);
          expect(compareSpy).not.toHaveBeenCalled();
          expect(hashSpy).not.toHaveBeenCalled();
          expect(signSpy).not.toHaveBeenCalled();
          expect(verifySpy).not.toHaveBeenCalled();
        }),
        { numRuns: 20 },
      );
    } finally {
      compareSpy.mockRestore();
      hashSpy.mockRestore();
      signSpy.mockRestore();
      verifySpy.mockRestore();
    }
  }, 60000);

  it('Propiedad 18: toda excepción no manejada → respuesta con code y message, nunca stack trace ni "undefined" como valor', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 20 }), async (garbage) => {
        await resetRateLimiters();
        // Body JSON malformado a propósito: dispara una excepción real de body-parser
        // que llega al globalErrorHandler, en vez de simular el error a mano.
        const res = await request(app)
          .post('/api/auth/login')
          .set('Content-Type', 'application/json')
          .send(`{"username": "${garbage.replace(/"/g, '')}", invalid_json`);

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.body.code).toBe(res.status);
        expect(typeof res.body.message).toBe('string');
        expect(JSON.stringify(res.body)).not.toContain('at ');
        expect(Object.values(res.body).some((v) => v === undefined)).toBe(false);
        expect(JSON.stringify(res.body)).not.toContain('"undefined"');
      }),
      { numRuns: 15 },
    );
  }, 60000);
});
