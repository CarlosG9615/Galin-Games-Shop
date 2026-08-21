import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import request from 'supertest';
import { createRequire } from 'module';

// Base de datos de test dedicada, distinta de la usada por auth.properties.test.js,
// para que ambos ficheros puedan ejecutarse en paralelo sin pisarse datos.
process.env.MONGODB_URI = 'mongodb://localhost:27017/GalinGames-property-email';

// Ver auth.properties.test.js para la explicación de por qué se usa createRequire en
// vez de import para los módulos propios del backend.
const require = createRequire(import.meta.url);

const app = require('../../server.js');
const mongoose = require('mongoose');
const connectDB = require('../../src/config/db.js');
const User = require('../../src/models/User.js');
const PendingUser = require('../../src/models/PendingUser.js');
const emailServiceModule = require('../../src/services/emailService.js');
const { loginLimiter, registerLimiter, verifyEmailLimiter } = require('../../src/middleware/rateLimiter.js');

const RATE_LIMIT_KEYS = ['127.0.0.1', '::ffff:127.0.0.1', '::1'];

async function resetRateLimiters() {
  for (const limiter of [loginLimiter, registerLimiter, verifyEmailLimiter]) {
    for (const key of RATE_LIMIT_KEYS) {
      try {
        await limiter.resetKey(key);
      } catch {
        // clave no representada por este store todavía — no pasa nada
      }
    }
  }
}

async function clearAll() {
  await User.deleteMany({});
  await PendingUser.deleteMany({});
}

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
  return `prop-email-verif-${Date.now()}-${emailCounter}@example.com`;
}

let sendVerificationEmailSpy;

beforeAll(async () => {
  await connectDB();
  sendVerificationEmailSpy = vi.spyOn(emailServiceModule, 'sendVerificationEmail').mockResolvedValue(undefined);
}, 20000);

afterEach(async () => {
  await clearAll();
  await resetRateLimiters();
  sendVerificationEmailSpy.mockClear();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

async function registerAndGetPlainToken({ username, password, email }) {
  const res = await request(app).post('/api/auth/register').send({
    username,
    nombre: 'Prop',
    apellidos: 'Test',
    email,
    password,
    repetirPassword: password,
  });
  expect(res.status).toBe(201);

  const lastCall = sendVerificationEmailSpy.mock.calls.at(-1);
  expect(lastCall).toBeDefined();
  return lastCall[2]; // sendVerificationEmail(to, username, verificationToken)
}

describe('Propiedades 19-22 — verificación de email (Task 37.7)', () => {
  it('Propiedad 19: mientras el token no se consuma, ninguna consulta a users devuelve documento para ese username/email', async () => {
    await fc.assert(
      fc.asyncProperty(validUsernameArb, validPasswordArb, async (username, password) => {
        await clearAll();
        await resetRateLimiters();
        const email = uniqueEmail();

        await registerAndGetPlainToken({ username, password, email });

        const byUsername = await User.findOne({ username });
        const byEmail = await User.findOne({ email });
        expect(byUsername).toBeNull();
        expect(byEmail).toBeNull();

        const pending = await PendingUser.findOne({ username });
        expect(pending).not.toBeNull();
      }),
      { numRuns: 15 },
    );
  }, 60000);

  it('Propiedad 20: un Verification_Token ya consumido → una segunda petición nunca crea un segundo User ni redirige a éxito', async () => {
    await fc.assert(
      fc.asyncProperty(validUsernameArb, validPasswordArb, async (username, password) => {
        await clearAll();
        await resetRateLimiters();
        const email = uniqueEmail();
        const token = await registerAndGetPlainToken({ username, password, email });

        const firstRes = await request(app).get(`/api/auth/verify-email?token=${token}`).redirects(0);
        expect(firstRes.status).toBe(302);
        expect(firstRes.headers.location).toContain('/login?verificado=true');

        const secondRes = await request(app).get(`/api/auth/verify-email?token=${token}`).redirects(0);
        expect(secondRes.status).toBe(302);
        expect(secondRes.headers.location).toContain('/error/410');

        const usersWithUsername = await User.countDocuments({ username });
        expect(usersWithUsername).toBe(1);
      }),
      { numRuns: 12 },
    );
  }, 60000);

  it('Propiedad 21: un PendingUser con expiresAt en el pasado → verify-email nunca crea un User, aunque el TTL de Mongo no lo haya borrado aún', async () => {
    await fc.assert(
      fc.asyncProperty(validUsernameArb, validPasswordArb, async (username, password) => {
        await clearAll();
        await resetRateLimiters();
        const email = uniqueEmail();
        const token = await registerAndGetPlainToken({ username, password, email });

        // Inserción directa vía driver nativo (bypassea Mongoose) para forzar expiresAt
        // en el pasado sin depender de que el índice TTL de Mongo ya lo haya borrado.
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(token).digest('hex');
        await mongoose.connection
          .collection('pendingusers')
          .updateOne({ verificationTokenHash: hash }, { $set: { expiresAt: new Date(Date.now() - 60_000) } });

        const res = await request(app).get(`/api/auth/verify-email?token=${token}`).redirects(0);

        expect(res.status).toBe(302);
        expect(res.headers.location).toContain('/error/410');
        const user = await User.findOne({ username });
        expect(user).toBeNull();
      }),
      { numRuns: 12 },
    );
  }, 60000);

  it('Propiedad 22: tras consumir el token con éxito → un login inmediato con el username y la contraseña originales devuelve HTTP 200', async () => {
    await fc.assert(
      fc.asyncProperty(validUsernameArb, validPasswordArb, async (username, password) => {
        await clearAll();
        await resetRateLimiters();
        const email = uniqueEmail();
        const token = await registerAndGetPlainToken({ username, password, email });

        const verifyRes = await request(app).get(`/api/auth/verify-email?token=${token}`).redirects(0);
        expect(verifyRes.status).toBe(302);
        expect(verifyRes.headers.location).toContain('/login?verificado=true');

        const loginRes = await request(app).post('/api/auth/login').send({ username, password });
        expect(loginRes.status).toBe(200);
      }),
      { numRuns: 12 },
    );
  }, 60000);
});
