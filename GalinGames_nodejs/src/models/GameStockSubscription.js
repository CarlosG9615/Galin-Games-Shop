const mongoose = require('mongoose');

const GameStockSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El userId es obligatorio'],
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: [true, 'El gameId es obligatorio'],
  },
  plataforma: {
    type: String,
    required: [true, 'La plataforma es obligatoria'],
    enum: {
      values: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
      message: 'Plataforma no válida',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

// Evita duplicados a nivel de base de datos: un usuario no puede suscribirse dos veces
// a la misma combinación juego+plataforma (Requisito 13.3).
GameStockSubscriptionSchema.index({ userId: 1, gameId: 1, plataforma: 1 }, { unique: true });

module.exports = mongoose.model('GameStockSubscription', GameStockSubscriptionSchema);
