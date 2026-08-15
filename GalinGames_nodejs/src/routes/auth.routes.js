const express = require('express');
const { loginLimiter, registerLimiter, refreshLimiter } = require('../middleware/rateLimiter');
const { validateLoginInput, validateRegisterInput } = require('../middleware/validator');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/login', loginLimiter, validateLoginInput, authController.login);
router.post('/register', registerLimiter, validateRegisterInput, authController.register);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;
