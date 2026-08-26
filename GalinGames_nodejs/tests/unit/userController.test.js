import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'module';
import env from '../../src/config/env.js';
import { createUserController } from '../../src/controllers/userController.js';

// createRequire (no `import bcrypt from 'bcryptjs'`): comparte la caché nativa de
// Node con el require() interno de userController.js, así que vi.spyOn(bcrypt, ...)
// aquí intercepta también las llamadas que hace el controlador (mismo motivo que
// tests/property/auth.properties.test.js usa createRequire para User/PendingUser).
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.redirect = vi.fn().mockReturnValue(res);
  res.clearCookie = vi.fn().mockReturnValue(res);
  return res;
}

function buildUserDoc(overrides = {}) {
  return {
    _id: 'user-1',
    nombre: 'Carlos',
    apellidos: 'Galindo',
    username: 'carlos',
    telefono: null,
    nacionalidad: null,
    email: 'carlos@example.com',
    avatarUrl: null,
    avatarPublicId: null,
    password: '$2b$12$hashedpasswordvalue0000000000000000000000000000000',
    sensitiveActionLocks: {
      emailChange: { attempts: 0, blockedUntil: null },
      deleteAccount: { attempts: 0, blockedUntil: null },
      changePassword: { attempts: 0, blockedUntil: null },
    },
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function buildController(overrides = {}) {
  const User = {
    findById: vi.fn(),
    findOne: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    ...overrides.User,
  };
  const PendingEmailChange = {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
    ...overrides.PendingEmailChange,
  };
  const Address = { deleteMany: vi.fn().mockResolvedValue(undefined), ...overrides.Address };
  const cloudinaryService = {
    uploadAvatar: vi.fn(),
    deleteAsset: vi.fn().mockResolvedValue(undefined),
    ...overrides.cloudinaryService,
  };
  const emailService = { sendEmailChangeVerification: vi.fn().mockResolvedValue(undefined), ...overrides.emailService };
  const emailVerificationService = {
    generateVerificationToken: vi.fn(() => ({ token: 'token-en-claro', hash: 'hash-del-token' })),
    hashVerificationToken: vi.fn((token) => `hash-de-${token}`),
    ...overrides.emailVerificationService,
  };
  const sensitiveActionLockService = {
    isLocked: vi.fn(() => false),
    registerFailedAttempt: vi.fn(),
    resetLock: vi.fn(),
    ...overrides.sensitiveActionLockService,
  };

  const controller = createUserController({
    User,
    PendingEmailChange,
    Address,
    cloudinaryService,
    emailService,
    emailVerificationService,
    sensitiveActionLockService,
  });

  return { controller, User, PendingEmailChange, Address, cloudinaryService, emailService, emailVerificationService, sensitiveActionLockService };
}

describe('userController.getMe', () => {
  it('devuelve 200 con los datos serializados del usuario', async () => {
    const { controller, User } = buildController();
    User.findById.mockResolvedValueOnce(buildUserDoc());

    const req = { user: { userId: 'user-1' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.getMe(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'carlos', email: 'carlos@example.com' }),
    );
    expect(res.json.mock.calls[0][0]).not.toHaveProperty('password');
  });

  it('llama a next con AppError 404 si el usuario no existe', async () => {
    const { controller, User } = buildController();
    User.findById.mockResolvedValueOnce(null);

    const req = { user: { userId: 'no-existe' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.getMe(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].status).toBe(404);
  });
});

describe('userController.updateMe', () => {
  it('actualiza nombre/apellidos/telefono/nacionalidad y devuelve 200', async () => {
    const { controller, User } = buildController();
    const user = buildUserDoc();
    User.findById.mockResolvedValueOnce(user);

    const req = { user: { userId: 'user-1' }, body: { telefono: '600123456', nacionalidad: 'Española' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.updateMe(req, res, next);

    expect(user.telefono).toBe('600123456');
    expect(user.nacionalidad).toBe('Española');
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('no comprueba disponibilidad ni modifica username si coincide con el actual (Requisito 5.4)', async () => {
    const { controller, User } = buildController();
    const user = buildUserDoc();
    User.findById.mockResolvedValueOnce(user);

    const req = { user: { userId: 'user-1' }, body: { username: 'carlos' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.updateMe(req, res, next);

    expect(User.findOne).not.toHaveBeenCalled();
    expect(user.username).toBe('carlos');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('devuelve 409 si el nuevo username ya está en uso por otro usuario', async () => {
    const { controller, User } = buildController();
    const user = buildUserDoc();
    User.findById.mockResolvedValueOnce(user);
    User.findOne.mockResolvedValueOnce({ _id: 'otro-usuario', username: 'nuevoNombre' });

    const req = { user: { userId: 'user-1' }, body: { username: 'nuevoNombre' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.updateMe(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].status).toBe(409);
    expect(user.save).not.toHaveBeenCalled();
  });

  it('actualiza el username cuando está disponible', async () => {
    const { controller, User } = buildController();
    const user = buildUserDoc();
    User.findById.mockResolvedValueOnce(user);
    User.findOne.mockResolvedValueOnce(null);

    const req = { user: { userId: 'user-1' }, body: { username: 'nuevoNombre' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.updateMe(req, res, next);

    expect(user.username).toBe('nuevoNombre');
    expect(user.save).toHaveBeenCalledTimes(1);
  });
});

describe('userController.checkUsername', () => {
  it('devuelve available:true sin consultar findOne si coincide con el username actual', async () => {
    const { controller, User } = buildController();
    User.findById.mockResolvedValueOnce(buildUserDoc());

    const req = { user: { userId: 'user-1' }, query: { username: 'carlos' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.checkUsername(req, res, next);

    expect(User.findOne).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ available: true });
  });

  it('devuelve available:false si el username ya está ocupado por otro usuario', async () => {
    const { controller, User } = buildController();
    User.findById.mockResolvedValueOnce(buildUserDoc());
    User.findOne.mockResolvedValueOnce({ _id: 'otro-usuario', username: 'ocupado' });

    const req = { user: { userId: 'user-1' }, query: { username: 'ocupado' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.checkUsername(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ available: false });
  });

  it('llama a next con AppError 400 si falta el query param username', async () => {
    const { controller } = buildController();

    const req = { user: { userId: 'user-1' }, query: {} };
    const res = mockRes();
    const next = vi.fn();

    await controller.checkUsername(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].status).toBe(400);
  });
});

describe('userController.uploadAvatar', () => {
  it('sube la imagen, borra el avatar anterior y devuelve 200 con avatarUrl', async () => {
    const { controller, User, cloudinaryService } = buildController();
    const user = buildUserDoc({ avatarPublicId: 'users/user-1/old' });
    User.findById.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(user) });
    cloudinaryService.uploadAvatar.mockResolvedValueOnce({
      url: 'https://res.cloudinary.com/demo/new.jpg',
      publicId: 'users/user-1/new',
    });

    const req = { user: { userId: 'user-1' }, file: { buffer: Buffer.from('imagen') } };
    const res = mockRes();
    const next = vi.fn();

    await controller.uploadAvatar(req, res, next);

    expect(cloudinaryService.uploadAvatar).toHaveBeenCalledWith(Buffer.from('imagen'), 'user-1');
    expect(user.avatarUrl).toBe('https://res.cloudinary.com/demo/new.jpg');
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(cloudinaryService.deleteAsset).toHaveBeenCalledWith('users/user-1/old');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ avatarUrl: 'https://res.cloudinary.com/demo/new.jpg' });
  });

  it('no llama a deleteAsset si el usuario no tenía avatar previo', async () => {
    const { controller, User, cloudinaryService } = buildController();
    const user = buildUserDoc({ avatarPublicId: null });
    User.findById.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(user) });
    cloudinaryService.uploadAvatar.mockResolvedValueOnce({ url: 'https://x/a.jpg', publicId: 'users/user-1/a' });

    const req = { user: { userId: 'user-1' }, file: { buffer: Buffer.from('imagen') } };
    const res = mockRes();
    const next = vi.fn();

    await controller.uploadAvatar(req, res, next);

    expect(cloudinaryService.deleteAsset).not.toHaveBeenCalled();
  });
});

describe('userController.verifyPassword', () => {
  it('llama a next con AppError 400 si la acción no es reconocida', async () => {
    const { controller } = buildController();

    const req = { user: { userId: 'user-1' }, body: { password: 'x', action: 'otraCosa' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.verifyPassword(req, res, next);

    expect(next.mock.calls[0][0].status).toBe(400);
  });

  it('devuelve 423 con blockedUntil si la acción está bloqueada', async () => {
    const blockedUntil = new Date(Date.now() + 3_600_000);
    const { controller, User, sensitiveActionLockService } = buildController({
      sensitiveActionLockService: { isLocked: vi.fn(() => true) },
    });
    const user = buildUserDoc({
      sensitiveActionLocks: { emailChange: { attempts: 5, blockedUntil }, deleteAccount: {}, changePassword: {} },
    });
    User.findById.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(user) });

    const req = { user: { userId: 'user-1' }, body: { password: 'x', action: 'emailChange' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.verifyPassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(423);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 423, blockedUntil }));
  });

  it('registra el intento fallido y devuelve 401 si la contraseña es incorrecta', async () => {
    const { controller, User, sensitiveActionLockService } = buildController();
    const user = buildUserDoc();
    User.findById.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(user) });
    vi.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

    const req = { user: { userId: 'user-1' }, body: { password: 'incorrecta', action: 'emailChange' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.verifyPassword(req, res, next);

    expect(sensitiveActionLockService.registerFailedAttempt).toHaveBeenCalledWith(user, 'emailChange');
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(401);
    vi.restoreAllMocks();
  });

  it('restablece el lock y devuelve 200 verified:true si la contraseña es correcta', async () => {
    const { controller, User, sensitiveActionLockService } = buildController();
    const user = buildUserDoc();
    User.findById.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(user) });
    vi.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

    const req = { user: { userId: 'user-1' }, body: { password: 'correcta', action: 'emailChange' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.verifyPassword(req, res, next);

    expect(sensitiveActionLockService.resetLock).toHaveBeenCalledWith(user, 'emailChange');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ verified: true });
    vi.restoreAllMocks();
  });
});

describe('userController.requestEmailChange', () => {
  it('devuelve 401 y registra el intento fallido si la contraseña es incorrecta', async () => {
    const { controller, User, sensitiveActionLockService } = buildController();
    const user = buildUserDoc();
    User.findById.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(user) });
    vi.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

    const req = { user: { userId: 'user-1' }, body: { password: 'mala', newEmail: 'nuevo@example.com' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.requestEmailChange(req, res, next);

    expect(sensitiveActionLockService.registerFailedAttempt).toHaveBeenCalledWith(user, 'emailChange');
    expect(res.status).toHaveBeenCalledWith(401);
    vi.restoreAllMocks();
  });

  it('llama a next con AppError 400 si el nuevo email es igual al actual', async () => {
    const { controller, User } = buildController();
    const user = buildUserDoc();
    User.findById.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(user) });
    vi.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

    const req = { user: { userId: 'user-1' }, body: { password: 'correcta', newEmail: 'carlos@example.com' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.requestEmailChange(req, res, next);

    expect(next.mock.calls[0][0].status).toBe(400);
    vi.restoreAllMocks();
  });

  it('llama a next con AppError 409 si el nuevo email ya está en uso', async () => {
    const { controller, User } = buildController();
    const user = buildUserDoc();
    User.findById.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(user) });
    User.findOne.mockResolvedValueOnce({ _id: 'otro-usuario', email: 'nuevo@example.com' });
    vi.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

    const req = { user: { userId: 'user-1' }, body: { password: 'correcta', newEmail: 'nuevo@example.com' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.requestEmailChange(req, res, next);

    expect(next.mock.calls[0][0].status).toBe(409);
    vi.restoreAllMocks();
  });

  it('crea la solicitud pendiente, envía el correo y devuelve 202', async () => {
    const { controller, User, PendingEmailChange, emailService } = buildController();
    const user = buildUserDoc();
    User.findById.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(user) });
    User.findOne.mockResolvedValueOnce(null);
    PendingEmailChange.findOneAndUpdate.mockResolvedValueOnce({ _id: 'pending-1' });
    vi.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

    const req = { user: { userId: 'user-1' }, body: { password: 'correcta', newEmail: 'nuevo@example.com' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.requestEmailChange(req, res, next);

    expect(PendingEmailChange.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'user-1' },
      expect.objectContaining({ userId: 'user-1', newEmail: 'nuevo@example.com', tokenHash: 'hash-del-token' }),
      expect.objectContaining({ upsert: true }),
    );
    expect(emailService.sendEmailChangeVerification).toHaveBeenCalledWith('nuevo@example.com', 'carlos', 'token-en-claro');
    expect(res.status).toHaveBeenCalledWith(202);
    vi.restoreAllMocks();
  });

  it('elimina la solicitud pendiente y llama a next con 500 si el envío del correo falla', async () => {
    const { controller, User, PendingEmailChange, emailService } = buildController();
    const user = buildUserDoc();
    User.findById.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(user) });
    User.findOne.mockResolvedValueOnce(null);
    PendingEmailChange.findOneAndUpdate.mockResolvedValueOnce({ _id: 'pending-2' });
    emailService.sendEmailChangeVerification.mockRejectedValueOnce(new Error('SMTP down'));
    vi.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

    const req = { user: { userId: 'user-1' }, body: { password: 'correcta', newEmail: 'nuevo@example.com' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.requestEmailChange(req, res, next);

    expect(PendingEmailChange.deleteOne).toHaveBeenCalledWith({ _id: 'pending-2' });
    expect(next.mock.calls[0][0].status).toBe(500);
    vi.restoreAllMocks();
  });
});

describe('userController.confirmEmailChange', () => {
  it('redirige a error/400 si falta el token', async () => {
    const { controller } = buildController();

    const req = { query: {} };
    const res = mockRes();

    await controller.confirmEmailChange(req, res);

    expect(res.redirect).toHaveBeenCalledWith(302, `${env.FRONTEND_URL}/error/400`);
  });

  it('redirige a error/410 si el token no corresponde a ninguna solicitud', async () => {
    const { controller, PendingEmailChange } = buildController();
    PendingEmailChange.findOne.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(null) });

    const req = { query: { token: 'token-inventado' } };
    const res = mockRes();

    await controller.confirmEmailChange(req, res);

    expect(res.redirect).toHaveBeenCalledWith(302, `${env.FRONTEND_URL}/error/410`);
  });

  it('elimina la solicitud y redirige a error/410 si el token está caducado', async () => {
    const { controller, PendingEmailChange, User } = buildController();
    const expired = { _id: 'pending-3', userId: 'user-1', newEmail: 'nuevo@example.com', expiresAt: new Date(Date.now() - 1000) };
    PendingEmailChange.findOne.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(expired) });

    const req = { query: { token: 'token-caducado' } };
    const res = mockRes();

    await controller.confirmEmailChange(req, res);

    expect(PendingEmailChange.deleteOne).toHaveBeenCalledWith({ _id: 'pending-3' });
    expect(User.updateOne).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(302, `${env.FRONTEND_URL}/error/410`);
  });

  it('actualiza el email del usuario, elimina la solicitud y redirige con éxito', async () => {
    const { controller, PendingEmailChange, User } = buildController();
    const pending = { _id: 'pending-4', userId: 'user-1', newEmail: 'nuevo@example.com', expiresAt: new Date(Date.now() + 3_600_000) };
    PendingEmailChange.findOne.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(pending) });
    User.updateOne.mockResolvedValueOnce(undefined);

    const req = { query: { token: 'token-valido' } };
    const res = mockRes();

    await controller.confirmEmailChange(req, res);

    expect(User.updateOne).toHaveBeenCalledWith({ _id: 'user-1' }, { email: 'nuevo@example.com' });
    expect(PendingEmailChange.deleteOne).toHaveBeenCalledWith({ _id: 'pending-4' });
    expect(res.redirect).toHaveBeenCalledWith(302, `${env.FRONTEND_URL}/mi-cuenta/perfil?emailActualizado=true`);
  });
});

describe('userController.changePassword', () => {
  it('devuelve 423 si la acción changePassword está bloqueada', async () => {
    const { controller, User } = buildController({ sensitiveActionLockService: { isLocked: vi.fn(() => true) } });
    const user = buildUserDoc();
    User.findById.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(user) });

    const req = { user: { userId: 'user-1' }, body: { currentPassword: 'x', newPassword: 'y', repeatNewPassword: 'y' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.changePassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(423);
  });

  it('devuelve 401 y registra el intento si la contraseña actual es incorrecta', async () => {
    const { controller, User, sensitiveActionLockService } = buildController();
    const user = buildUserDoc();
    User.findById.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(user) });
    vi.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

    const req = { user: { userId: 'user-1' }, body: { currentPassword: 'mala', newPassword: 'nuevaPassword123', repeatNewPassword: 'nuevaPassword123' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.changePassword(req, res, next);

    expect(sensitiveActionLockService.registerFailedAttempt).toHaveBeenCalledWith(user, 'changePassword');
    expect(res.status).toHaveBeenCalledWith(401);
    vi.restoreAllMocks();
  });

  it('hashea la nueva contraseña y devuelve 200 cuando la actual es correcta', async () => {
    const { controller, User, sensitiveActionLockService } = buildController();
    const user = buildUserDoc();
    User.findById.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(user) });
    vi.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

    const req = { user: { userId: 'user-1' }, body: { currentPassword: 'actual', newPassword: 'nuevaPassword123', repeatNewPassword: 'nuevaPassword123' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.changePassword(req, res, next);

    expect(sensitiveActionLockService.resetLock).toHaveBeenCalledWith(user, 'changePassword');
    expect(user.password).not.toBe('nuevaPassword123');
    expect(user.password).toMatch(/^\$2[aby]\$/);
    expect(res.status).toHaveBeenCalledWith(200);
    vi.restoreAllMocks();
  });
});

describe('userController.deleteAccount', () => {
  it('devuelve 401 y registra el intento si la contraseña es incorrecta', async () => {
    const { controller, User, sensitiveActionLockService } = buildController();
    const user = buildUserDoc();
    User.findById.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(user) });
    vi.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

    const req = { user: { userId: 'user-1' }, body: { password: 'mala' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.deleteAccount(req, res, next);

    expect(sensitiveActionLockService.registerFailedAttempt).toHaveBeenCalledWith(user, 'deleteAccount');
    expect(res.status).toHaveBeenCalledWith(401);
    vi.restoreAllMocks();
  });

  it('borra direcciones, avatar y usuario, limpia cookies y devuelve 200', async () => {
    const { controller, User, Address, cloudinaryService } = buildController();
    const user = buildUserDoc({ avatarPublicId: 'users/user-1/foto' });
    User.findById.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(user) });
    User.deleteOne.mockResolvedValueOnce(undefined);
    vi.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

    const req = { user: { userId: 'user-1' }, body: { password: 'correcta' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.deleteAccount(req, res, next);

    expect(Address.deleteMany).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(cloudinaryService.deleteAsset).toHaveBeenCalledWith('users/user-1/foto');
    expect(User.deleteOne).toHaveBeenCalledWith({ _id: 'user-1' });
    expect(res.clearCookie).toHaveBeenCalledWith('token', { path: '/' });
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/api/auth/refresh' });
    expect(res.status).toHaveBeenCalledWith(200);
    vi.restoreAllMocks();
  });
});
