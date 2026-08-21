const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'El nombre de usuario es obligatorio'],
    trim: true,
    minlength: [3, 'El username debe tener al menos 3 caracteres'],
    maxlength: [50, 'El username no puede superar los 50 caracteres'],
  },
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede superar los 100 caracteres'],
  },
  apellidos: {
    type: String,
    required: [true, 'Los apellidos son obligatorios'],
    trim: true,
    maxlength: [150, 'Los apellidos no pueden superar los 150 caracteres'],
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Formato de email inválido'],
    maxlength: [255, 'El email no puede superar los 255 caracteres'],
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [60, 'Longitud mínima para hashes bcrypt'],
    select: false,
  },
  fechaRegistro: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  refreshTokenHash: {
    type: String,
    default: null,
    select: false,
  },
});

// La unicidad se declara solo aquí (no también como `unique: true` en el campo)
// para evitar el índice duplicado que Mongoose advierte en consola al arrancar.
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);
