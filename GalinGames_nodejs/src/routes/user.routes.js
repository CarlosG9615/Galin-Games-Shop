const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateUpdateProfileInput, validateChangePasswordInput } = require('../middleware/validator');
const { handleAvatarUpload } = require('../middleware/uploadAvatar');
const userController = require('../controllers/userController');

const router = express.Router();

// GET /verify-email-change se abre por navegación directa desde el correo de
// verificación (Requisito 7.5): sin requireAuth, igual que GET /api/auth/verify-email.
router.get('/verify-email-change', userController.confirmEmailChange);

router.get('/me', requireAuth, userController.getMe);
router.patch('/me', requireAuth, validateUpdateProfileInput, userController.updateMe);
router.get('/me/check-username', requireAuth, userController.checkUsername);
router.post('/me/avatar', requireAuth, handleAvatarUpload, userController.uploadAvatar);
router.post('/me/verify-password', requireAuth, userController.verifyPassword);
router.put('/me/email', requireAuth, userController.requestEmailChange);
router.put('/me/password', requireAuth, validateChangePasswordInput, userController.changePassword);
router.delete('/me', requireAuth, userController.deleteAccount);

module.exports = router;
