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
});
