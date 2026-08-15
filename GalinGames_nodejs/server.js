// Primera línea: valida las variables de entorno antes de cargar cualquier otro módulo.
const env = require('./src/config/env');

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth.routes');
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
    methods: ['GET', 'POST'],
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

app.use(globalErrorHandler);

async function start() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`[Server] Escuchando en el puerto ${env.PORT}`);
  });
}

start();

module.exports = app;
