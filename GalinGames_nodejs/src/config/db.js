const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('[DB] Conexión a MongoDB establecida');
  } catch (err) {
    console.error('[DB] Error de conexión:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
