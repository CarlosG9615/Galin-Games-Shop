const mongoose = require('mongoose');

const PendingEmailChangeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El userId es obligatorio'],
  },
  newEmail: {
    type: String,
    required: [true, 'El nuevo email es obligatorio'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Formato de email inválido'],
    maxlength: [255, 'El email no puede superar los 255 caracteres'],
  },
  tokenHash: {
    type: String,
    required: [true, 'El hash del token de verificación es obligatorio'],
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  expiresAt: {
    type: Date,
    required: [true, 'La fecha de caducidad es obligatoria'],
  },
});

// Una única solicitud de cambio de email pendiente por usuario (se sobrescribe con
// upsert si el usuario pide otro cambio antes de verificar el anterior).
PendingEmailChangeSchema.index({ userId: 1 }, { unique: true });
PendingEmailChangeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PendingEmailChange', PendingEmailChangeSchema);
