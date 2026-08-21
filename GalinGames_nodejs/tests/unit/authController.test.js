import { describe, it, expect, vi, beforeEach } from 'vitest';
import env from '../../src/config/env.js';
import { createAuthController } from '../../src/controllers/authController.js';
import tokenService from '../../src/services/tokenService.js';
import refreshTokenService from '../../src/services/refreshTokenService.js';
import emailVerificationService from '../../src/services/emailVerificationService.js';

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.redirect = vi.fn().mockReturnValue(res);
  return res;
}

function buildController(overrides = {}) {
  const User = { findOne: vi.fn(), create: vi.fn(), ...overrides.User };
  const PendingUser = { findOne: vi.fn(), create: vi.fn(), deleteOne: vi.fn(), ...overrides.PendingUser };
  const emailService = { sendVerificationEmail: vi.fn(), ...overrides.emailService };

  const controller = createAuthController({
    User,
    PendingUser,
    tokenService,
    refreshTokenService,
    emailVerificationService,
    emailService,
  });

  return { controller, User, PendingUser, emailService };
}

const validRegisterBody = {
  username: 'carlos',
  nombre: 'Carlos',
  apellidos: 'Galindo',
  email: 'carlos@example.com',
  password: 'password123',
};

describe('authController.register (verificación de email, con dependencias mockeadas)', () => {
  it('crea un PendingUser y no un User cuando los datos son válidos y únicos', async () => {
    const { controller, User, PendingUser, emailService } = buildController();
    User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    PendingUser.findOne.mockResolvedValueOnce(null);
    PendingUser.create.mockResolvedValueOnce({ _id: 'pending-1' });
    emailService.sendVerificationEmail.mockResolvedValueOnce(undefined);

    const req = { body: { ...validRegisterBody } };
    const res = mockRes();
    const next = vi.fn();

    await controller.register(req, res, next);

    expect(User.create).not.toHaveBeenCalled();
    expect(PendingUser.create).toHaveBeenCalledTimes(1);
    const created = PendingUser.create.mock.calls[0][0];
    expect(created.username).toBe('carlos');
    expect(created.password).not.toBe('password123');
    expect(created.password).toMatch(/^\$2[aby]\$/);
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith('carlos@example.com', 'carlos', expect.any(String));
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('reenvía el correo (sin crear un segundo PendingUser) si ya existe uno no caducado con ese username/email', async () => {
    const { controller, User, PendingUser, emailService } = buildController();
    User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    const existingPendingUser = {
      _id: 'existing-1',
      set: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    };
    PendingUser.findOne.mockResolvedValueOnce(existingPendingUser);
    emailService.sendVerificationEmail.mockResolvedValueOnce(undefined);

    const req = { body: { ...validRegisterBody } };
    const res = mockRes();
    const next = vi.fn();

    await controller.register(req, res, next);

    expect(PendingUser.create).not.toHaveBeenCalled();
    expect(existingPendingUser.set).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'carlos', email: 'carlos@example.com' }),
    );
    expect(existingPendingUser.save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('elimina el PendingUser recién creado si emailService.sendVerificationEmail rechaza', async () => {
    const { controller, User, PendingUser, emailService } = buildController();
    User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    PendingUser.findOne.mockResolvedValueOnce(null);
    PendingUser.create.mockResolvedValueOnce({ _id: 'pending-2' });
    emailService.sendVerificationEmail.mockRejectedValueOnce(new Error('SMTP down'));

    const req = { body: { ...validRegisterBody } };
    const res = mockRes();
    const next = vi.fn();

    await controller.register(req, res, next);

    expect(PendingUser.deleteOne).toHaveBeenCalledWith({ _id: 'pending-2' });
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(500);
  });
});

describe('authController.verifyEmail (con dependencias mockeadas)', () => {
  it('crea el User, elimina el PendingUser, y redirige a login?verificado=true con un token válido', async () => {
    const { controller, User, PendingUser } = buildController();
    const pendingUserDoc = {
      _id: 'pu-1',
      username: 'carlos',
      nombre: 'Carlos',
      apellidos: 'Galindo',
      email: 'carlos@example.com',
      password: '$2b$12$hashedpasswordvalue0000000000000000000000000000000',
      expiresAt: new Date(Date.now() + 3_600_000),
    };
    PendingUser.findOne.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(pendingUserDoc) });
    User.create.mockResolvedValueOnce({ _id: 'user-1' });
    PendingUser.deleteOne.mockResolvedValueOnce(undefined);

    const req = { query: { token: 'token-en-claro' } };
    const res = mockRes();

    await controller.verifyEmail(req, res);

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'carlos', email: 'carlos@example.com', password: pendingUserDoc.password }),
    );
    expect(PendingUser.deleteOne).toHaveBeenCalledWith({ _id: 'pu-1' });
    expect(res.redirect).toHaveBeenCalledWith(302, `${env.FRONTEND_URL}/login?verificado=true`);
  });

  it('redirige a error/410 con un token inexistente', async () => {
    const { controller, User, PendingUser } = buildController();
    PendingUser.findOne.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(null) });

    const req = { query: { token: 'token-inventado' } };
    const res = mockRes();

    await controller.verifyEmail(req, res);

    expect(User.create).not.toHaveBeenCalled();
    expect(PendingUser.deleteOne).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(302, `${env.FRONTEND_URL}/error/410`);
  });

  it('redirige a error/410 y elimina el PendingUser con un token caducado', async () => {
    const { controller, User, PendingUser } = buildController();
    const expiredPendingUser = { _id: 'pu-2', expiresAt: new Date(Date.now() - 1000) };
    PendingUser.findOne.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(expiredPendingUser) });

    const req = { query: { token: 'token-caducado' } };
    const res = mockRes();

    await controller.verifyEmail(req, res);

    expect(User.create).not.toHaveBeenCalled();
    expect(PendingUser.deleteOne).toHaveBeenCalledWith({ _id: 'pu-2' });
    expect(res.redirect).toHaveBeenCalledWith(302, `${env.FRONTEND_URL}/error/410`);
  });
});
