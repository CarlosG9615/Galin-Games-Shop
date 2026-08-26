import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import PendingEmailChange from '../../src/models/PendingEmailChange.js';

function basePending(overrides = {}) {
  return new PendingEmailChange({
    userId: new mongoose.Types.ObjectId(),
    newEmail: 'nuevo@example.com',
    tokenHash: 'b'.repeat(64),
    expiresAt: new Date(Date.now() + 60_000),
    ...overrides,
  });
}

describe('src/models/PendingEmailChange.js', () => {
  it('valida correctamente con todos los campos obligatorios', async () => {
    const pending = basePending();
    await expect(pending.validate()).resolves.toBeUndefined();
  });

  it('falla la validación si falta userId', async () => {
    const pending = basePending({ userId: undefined });
    await expect(pending.validate()).rejects.toMatchObject({
      errors: { userId: expect.anything() },
    });
  });

  it('falla la validación si falta tokenHash', async () => {
    const pending = basePending({ tokenHash: undefined });
    await expect(pending.validate()).rejects.toMatchObject({
      errors: { tokenHash: expect.anything() },
    });
  });

  it('falla la validación si falta expiresAt', async () => {
    const pending = basePending({ expiresAt: undefined });
    await expect(pending.validate()).rejects.toMatchObject({
      errors: { expiresAt: expect.anything() },
    });
  });

  it('falla la validación si newEmail tiene formato inválido', async () => {
    const pending = basePending({ newEmail: 'no-es-un-email' });
    await expect(pending.validate()).rejects.toMatchObject({
      errors: { newEmail: expect.anything() },
    });
  });

  it('tokenHash está marcado como select: false', () => {
    expect(PendingEmailChange.schema.path('tokenHash').options.select).toBe(false);
  });

  it('userId tiene índice único explícito', () => {
    const indexes = PendingEmailChange.schema.indexes();
    const userIdIndex = indexes.find(([def]) => def.userId === 1);
    expect(userIdIndex[1].unique).toBe(true);
  });

  it('expiresAt tiene un índice TTL con expireAfterSeconds: 0', () => {
    const indexes = PendingEmailChange.schema.indexes();
    const expiresIndex = indexes.find(([def]) => def.expiresAt === 1);
    expect(expiresIndex[1].expireAfterSeconds).toBe(0);
  });
});
