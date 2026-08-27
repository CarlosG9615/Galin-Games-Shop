import { describe, it, expect } from 'vitest';
import User from '../../src/models/User.js';

describe('src/models/User.js', () => {
  it('falla la validación de Mongoose si falta username', async () => {
    const user = new User({
      nombre: 'Carlos',
      apellidos: 'Galindo',
      email: 'carlos@example.com',
      password: 'a'.repeat(60),
    });
    await expect(user.validate()).rejects.toMatchObject({
      errors: { username: expect.anything() },
    });
  });

  it('los campos password y refreshTokenHash están marcados como select: false', () => {
    expect(User.schema.path('password').options.select).toBe(false);
    expect(User.schema.path('refreshTokenHash').options.select).toBe(false);
  });

  it('username y email tienen índice único explícito', () => {
    const indexes = User.schema.indexes();
    const usernameIndex = indexes.find(([def]) => def.username === 1);
    const emailIndex = indexes.find(([def]) => def.email === 1);
    expect(usernameIndex[1].unique).toBe(true);
    expect(emailIndex[1].unique).toBe(true);
  });

  it('telefono y nacionalidad son opcionales y no requieren valor', async () => {
    const user = new User({
      username: 'carlos',
      nombre: 'Carlos',
      apellidos: 'Galindo',
      email: 'carlos@example.com',
      password: 'a'.repeat(60),
    });
    await expect(user.validate()).resolves.toBeUndefined();
    expect(user.telefono).toBeNull();
    expect(user.nacionalidad).toBeNull();
    expect(user.avatarUrl).toBeNull();
  });

  it('avatarPublicId y sensitiveActionLocks están marcados como select: false', () => {
    expect(User.schema.path('avatarPublicId').options.select).toBe(false);
    expect(User.schema.path('sensitiveActionLocks').options.select).toBe(false);
  });

  it('sensitiveActionLocks tiene attempts:0 y blockedUntil:null por defecto para las 3 acciones', () => {
    const user = new User({
      username: 'carlos',
      nombre: 'Carlos',
      apellidos: 'Galindo',
      email: 'carlos@example.com',
      password: 'a'.repeat(60),
    });
    for (const action of ['emailChange', 'deleteAccount', 'changePassword']) {
      expect(user.sensitiveActionLocks[action].attempts).toBe(0);
      expect(user.sensitiveActionLocks[action].blockedUntil).toBeNull();
    }
  });
});
