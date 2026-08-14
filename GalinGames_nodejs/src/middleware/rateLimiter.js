const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

function keyGenerator(req) {
  if (process.env.NODE_ENV === 'production') {
    const forwarded = req.headers['x-forwarded-for'];
    if (!forwarded) return null;
    return forwarded.split(',')[0].trim();
  }
  return ipKeyGenerator(req.ip);
}

function buildHandler(message) {
  return (req, res) => {
    const resetTime = new Date(req.rateLimit.resetTime).getTime();
    const retryAfter = Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
    res.status(429).json({ message, retryAfter });
  };
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: buildHandler('Demasiados intentos de login. Espera antes de volver a intentarlo.'),
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: buildHandler('Demasiados intentos de registro. Espera antes de volver a intentarlo.'),
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: buildHandler('Demasiadas peticiones. Espera antes de volver a intentarlo.'),
});

module.exports = { loginLimiter, registerLimiter, refreshLimiter };
