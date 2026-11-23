// Primera línea: valida las variables de entorno antes de cargar cualquier otro módulo.
const env = require('./src/config/env');

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const addressRoutes = require('./src/routes/address.routes');
const gameRoutes = require('./src/routes/game.routes');
const gameStockWatcher = require('./src/services/gameStockWatcher');
const globalErrorHandler = require('./src/middleware/globalErrorHandler');
const AppError = require('./src/utils/AppError');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new AppError('Origen no autorizado', 403), false);
      }
    },
    credentials: true,
    // PUT/PATCH/DELETE añadidos para perfil, direcciones y cambio de email/contraseña
    // de mi-cuenta (Requisito 16.1, design.md → Security).
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  }),
);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    if (req.headers['x-forwarded-proto'] === 'http') {
      return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    }
  }

  return next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/games', gameRoutes);

app.use(globalErrorHandler);

async function start() {
  await connectDB();

  // No fatal: si MongoDB todavía no corre como replica set, los Change Streams no
  // están disponibles (design.md → Design Decisions). El catálogo (peticiones GET)
  // debe seguir funcionando igualmente; solo se pierde el aviso automático de stock.
  try {
    gameStockWatcher.start();
  } catch (err) {
    console.error('[Server] No se pudo iniciar gameStockWatcher (¿MongoDB no es un replica set?):', err.message);
  }

  app.listen(env.PORT, () => {
    console.log(`[Server] Escuchando en el puerto ${env.PORT}`);
  });
}

// Solo arranca el servidor (conexión a Mongo + listen) cuando se ejecuta directamente
// (`node server.js` / `npm run dev`), no cuando los tests de integración lo requieren
// como módulo para montarlo con supertest sobre una base de datos de test aparte.
if (require.main === module) {
  start();
}

module.exports = app;
