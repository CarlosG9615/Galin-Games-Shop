const bcrypt = require('bcryptjs');
const env = require('../config/env');
const defaultUser = require('../models/User');
const defaultPendingEmailChange = require('../models/PendingEmailChange');
const defaultAddress = require('../models/Address');
const defaultCloudinaryService = require('../services/cloudinaryService');
const defaultEmailService = require('../services/emailService');
const defaultEmailVerificationService = require('../services/emailVerificationService');
const defaultSensitiveActionLockService = require('../services/sensitiveActionLockService');
const { requireField, AppError } = require('../utils/nullGuard');

const BCRYPT_COST = 12;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/; // mismo patrón que User.email (design.md)
const SENSITIVE_ACTIONS = ['emailChange', 'deleteAccount', 'changePassword'];

function serializeUser(user) {
  return {
    nombre: user.nombre,
    apellidos: user.apellidos,
    username: user.username,
    telefono: user.telefono,
    nacionalidad: user.nacionalidad,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}

function lockedResponse(res, user, action) {
  return res.status(423).json({
    code: 423,
    message: 'Demasiados intentos. Inténtalo de nuevo en 24 horas.',
    blockedUntil: user.sensitiveActionLocks[action].blockedUntil,
  });
}

// Inyección de dependencias: mismo patrón que authController.createAuthController,
// permite mockear User/PendingEmailChange/Address/servicios en los tests.
function createUserController({
  User,
  PendingEmailChange,
  Address,
  cloudinaryService,
  emailService,
  emailVerificationService,
  sensitiveActionLockService,
}) {
  async function getMe(req, res, next) {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) return next(new AppError('Usuario no encontrado', 404));

      return res.status(200).json(serializeUser(user));
    } catch (err) {
      return next(err);
    }
  }

  async function updateMe(req, res, next) {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) return next(new AppError('Usuario no encontrado', 404));

      const { nombre, apellidos, telefono, nacionalidad, username } = req.body;

      if (nombre !== undefined) user.nombre = nombre;
      if (apellidos !== undefined) user.apellidos = apellidos;
      if (telefono !== undefined) user.telefono = telefono;
      if (nacionalidad !== undefined) user.nacionalidad = nacionalidad;

      // Username sin cambios respecto al actual = "sin cambios" (Requisito 5.4):
      // no se comprueba disponibilidad ni se toca el campo.
      if (username !== undefined) {
        const trimmed = username.trim();
        if (trimmed !== user.username) {
          const existing = await User.findOne({ username: trimmed });
          if (existing) return next(new AppError('El nombre de usuario ya está en uso', 409));
          user.username = trimmed;
        }
      }

      await user.save();

      return res.status(200).json(serializeUser(user));
    } catch (err) {
      return next(err);
    }
  }

  async function checkUsername(req, res, next) {
    try {
      const { username } = req.query;
      requireField(username, 'username');
      const trimmed = username.trim();

      const currentUser = await User.findById(req.user.userId);
      if (!currentUser) return next(new AppError('Usuario no encontrado', 404));

      // Requisito 5.4: el propio username actual del usuario siempre está "disponible".
      if (trimmed === currentUser.username) {
        return res.status(200).json({ available: true });
      }

      const existing = await User.findOne({ username: trimmed });
      return res.status(200).json({ available: !existing });
    } catch (err) {
      return next(err);
    }
  }

  async function uploadAvatar(req, res, next) {
    try {
      const user = await User.findById(req.user.userId).select('+avatarPublicId');
      if (!user) return next(new AppError('Usuario no encontrado', 404));

      const previousPublicId = user.avatarPublicId;
      const { url, publicId } = await cloudinaryService.uploadAvatar(req.file.buffer, req.user.userId);

      user.avatarUrl = url;
      user.avatarPublicId = publicId;
      await user.save();

      // Se borra el avatar anterior después de guardar el nuevo (Requisito 6.3): si el
      // borrado falla no debe deshacer la subida ya persistida (best-effort en el servicio).
      if (previousPublicId) {
        await cloudinaryService.deleteAsset(previousPublicId);
      }

      return res.status(200).json({ avatarUrl: url });
    } catch (err) {
      return next(err);
    }
  }

  async function verifyPassword(req, res, next) {
    try {
      const { password, action } = req.body;
      requireField(password, 'password');
      requireField(action, 'action');

      if (!SENSITIVE_ACTIONS.includes(action)) {
        return next(new AppError('Acción no reconocida', 400));
      }

      const user = await User.findById(req.user.userId).select('+password +sensitiveActionLocks');
      if (!user) return next(new AppError('Usuario no encontrado', 404));

      if (sensitiveActionLockService.isLocked(user, action)) {
        return lockedResponse(res, user, action);
      }

      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        sensitiveActionLockService.registerFailedAttempt(user, action);
        await user.save();
        return res.status(401).json({ code: 401, message: 'Contraseña incorrecta' });
      }

      sensitiveActionLockService.resetLock(user, action);
      await user.save();

      return res.status(200).json({ verified: true });
    } catch (err) {
      return next(err);
    }
  }

  // PUT /me/email reverifica la contraseña en vez de confiar en un verify-password
  // previo (design.md → Design Decisions): defensa en profundidad, nunca se asume
  // que el paso anterior ocurrió de verdad.
  async function requestEmailChange(req, res, next) {
    try {
      const { password, newEmail } = req.body;
      requireField(password, 'password');
      requireField(newEmail, 'newEmail');

      const normalizedEmail = String(newEmail).trim().toLowerCase();
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return next(new AppError('Formato de email inválido', 400));
      }

      const user = await User.findById(req.user.userId).select('+password +sensitiveActionLocks');
      if (!user) return next(new AppError('Usuario no encontrado', 404));

      if (sensitiveActionLockService.isLocked(user, 'emailChange')) {
        return lockedResponse(res, user, 'emailChange');
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        sensitiveActionLockService.registerFailedAttempt(user, 'emailChange');
        await user.save();
        return res.status(401).json({ code: 401, message: 'Contraseña incorrecta' });
      }

      sensitiveActionLockService.resetLock(user, 'emailChange');

      if (normalizedEmail === user.email) {
        await user.save();
        return next(new AppError('El nuevo email debe ser distinto del actual', 400));
      }

      const emailInUse = await User.findOne({ email: normalizedEmail });
      if (emailInUse) {
        await user.save();
        return next(new AppError('El email ya está en uso', 409));
      }

      await user.save();

      const { token, hash: tokenHash } = emailVerificationService.generateVerificationToken();
      const expiresAt = new Date(Date.now() + env.EMAIL_VERIFICATION_EXPIRES_HOURS * 60 * 60 * 1000);

      // upsert: una solicitud pendiente por usuario (Requisito 7.5, design.md → Data Models).
      const pending = await PendingEmailChange.findOneAndUpdate(
        { userId: user._id },
        { userId: user._id, newEmail: normalizedEmail, tokenHash, expiresAt },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      try {
        await emailService.sendEmailChangeVerification(normalizedEmail, user.username, token);
      } catch {
        await PendingEmailChange.deleteOne({ _id: pending._id });
        return next(new AppError('No se pudo enviar el correo de verificación. Inténtalo de nuevo.', 500));
      }

      return res.status(202).json({ message: 'Te hemos enviado un correo de verificación a tu nuevo email.' });
    } catch (err) {
      return next(err);
    }
  }

  async function confirmEmailChange(req, res) {
    const { token } = req.query;

    try {
      if (!token || typeof token !== 'string') {
        return res.redirect(302, `${env.FRONTEND_URL}/error/400`);
      }

      const hash = emailVerificationService.hashVerificationToken(token);
      const pending = await PendingEmailChange.findOne({ tokenHash: hash }).select('+tokenHash');

      if (!pending || pending.expiresAt.getTime() < Date.now()) {
        if (pending) {
          await PendingEmailChange.deleteOne({ _id: pending._id });
        }
        return res.redirect(302, `${env.FRONTEND_URL}/error/410`);
      }

      await User.updateOne({ _id: pending.userId }, { email: pending.newEmail });
      await PendingEmailChange.deleteOne({ _id: pending._id });

      return res.redirect(302, `${env.FRONTEND_URL}/mi-cuenta/perfil?emailActualizado=true`);
    } catch (err) {
      // GET /verify-email-change se abre por navegación directa desde un correo, nunca
      // responde JSON — mismo patrón que authController.verifyEmail.
      console.error(`[${new Date().toISOString()}] GET /api/users/verify-email-change`, err.stack);
      return res.redirect(302, `${env.FRONTEND_URL}/error/500`);
    }
  }

  async function changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user.userId).select('+password +sensitiveActionLocks');
      if (!user) return next(new AppError('Usuario no encontrado', 404));

      if (sensitiveActionLockService.isLocked(user, 'changePassword')) {
        return lockedResponse(res, user, 'changePassword');
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        sensitiveActionLockService.registerFailedAttempt(user, 'changePassword');
        await user.save();
        return res.status(401).json({ code: 401, message: 'Contraseña actual incorrecta' });
      }

      sensitiveActionLockService.resetLock(user, 'changePassword');
      user.password = await bcrypt.hash(newPassword, BCRYPT_COST);
      await user.save();

      return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    } catch (err) {
      return next(err);
    }
  }

  async function deleteAccount(req, res, next) {
    try {
      const { password } = req.body;
      requireField(password, 'password');

      const user = await User.findById(req.user.userId).select('+password +sensitiveActionLocks +avatarPublicId');
      if (!user) return next(new AppError('Usuario no encontrado', 404));

      if (sensitiveActionLockService.isLocked(user, 'deleteAccount')) {
        return lockedResponse(res, user, 'deleteAccount');
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        sensitiveActionLockService.registerFailedAttempt(user, 'deleteAccount');
        await user.save();
        return res.status(401).json({ code: 401, message: 'Contraseña incorrecta' });
      }

      await Address.deleteMany({ userId: user._id });
      await cloudinaryService.deleteAsset(user.avatarPublicId);
      await User.deleteOne({ _id: user._id });

      res.clearCookie('token', { path: '/' });
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

      return res.status(200).json({ message: 'Cuenta eliminada correctamente' });
    } catch (err) {
      return next(err);
    }
  }

  return {
    getMe,
    updateMe,
    checkUsername,
    uploadAvatar,
    verifyPassword,
    requestEmailChange,
    confirmEmailChange,
    changePassword,
    deleteAccount,
  };
}

module.exports = createUserController({
  User: defaultUser,
  PendingEmailChange: defaultPendingEmailChange,
  Address: defaultAddress,
  cloudinaryService: defaultCloudinaryService,
  emailService: defaultEmailService,
  emailVerificationService: defaultEmailVerificationService,
  sensitiveActionLockService: defaultSensitiveActionLockService,
});
module.exports.createUserController = createUserController;
