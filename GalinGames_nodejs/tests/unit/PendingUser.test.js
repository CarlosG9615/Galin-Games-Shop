import { describe, it, expect } from 'vitest';
import PendingUser from '../../src/models/PendingUser.js';

describe('src/models/PendingUser.js', () => {
  it('falla la validación de Mongoose si falta verificationTokenHash', async () => {
    const pendingUser = new PendingUser({
      username: 'carlos',
      nombre: 'Carlos',
      apellidos: 'Galindo',
      email: 'carlos@example.com',
      password: 'a'.repeat(60),
      expiresAt: new Date(),
    });
    await expect(pendingUser.validate()).rejects.toMatchObject({
      errors: { verificationTokenHash: expect.anything() },
    });
  });

  it('falla la validación de Mongoose si falta expiresAt', async () => {
    const pendingUser = new PendingUser({
      username: 'carlos',
      nombre: 'Carlos',
      apellidos: 'Galindo',
      email: 'carlos@example.com',
      password: 'a'.repeat(60),
      verificationTokenHash: 'b'.repeat(64),
    });
    await expect(pendingUser.validate()).rejects.toMatchObject({
      errors: { expiresAt: expect.anything() },
    });
  });

  it('los campos password y verificationTokenHash están marcados como select: false', () => {
    expect(PendingUser.schema.path('password').options.select).toBe(false);
    expect(PendingUser.schema.path('verificationTokenHash').options.select).toBe(false);
  });

  it('username y email tienen índice único explícito', () => {
    const indexes = PendingUser.schema.indexes();
    const usernameIndex = indexes.find(([def]) => def.username === 1);
    const emailIndex = indexes.find(([def]) => def.email === 1);
    expect(usernameIndex[1].unique).toBe(true);
    expect(emailIndex[1].unique).toBe(true);
  });

  it('expiresAt tiene un índice TTL con expireAfterSeconds: 0', () => {
    const indexes = PendingUser.schema.indexes();
    const expiresIndex = indexes.find(([def]) => def.expiresAt === 1);
    expect(expiresIndex[1].expireAfterSeconds).toBe(0);
  });
});
