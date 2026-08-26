const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El userId es obligatorio'],
    },
    tipo: {
      type: String,
      required: [true, 'El tipo de dirección es obligatorio'],
      enum: {
        values: ['envio', 'facturacion'],
        message: 'El tipo de dirección debe ser "envio" o "facturacion"',
      },
    },
    titulo: {
      type: String,
      required: [true, 'El título de la dirección es obligatorio'],
      trim: true,
      maxlength: [100, 'El título no puede superar los 100 caracteres'],
    },
    calle: {
      type: String,
      required: [true, 'La calle es obligatoria'],
      trim: true,
      maxlength: [200, 'La calle no puede superar los 200 caracteres'],
    },
    numero: {
      type: String,
      required: [true, 'El número es obligatorio'],
      trim: true,
      maxlength: [20, 'El número no puede superar los 20 caracteres'],
    },
    pisoPuerta: {
      type: String,
      trim: true,
      maxlength: [50, 'El piso/puerta no puede superar los 50 caracteres'],
      default: null,
    },
    ciudad: {
      type: String,
      required: [true, 'La ciudad es obligatoria'],
      trim: true,
      maxlength: [100, 'La ciudad no puede superar los 100 caracteres'],
    },
    provincia: {
      type: String,
      required: [true, 'La provincia es obligatoria'],
      trim: true,
      maxlength: [100, 'La provincia no puede superar los 100 caracteres'],
    },
    codigoPostal: {
      type: String,
      required: [true, 'El código postal es obligatorio'],
      trim: true,
      maxlength: [12, 'El código postal no puede superar los 12 caracteres'],
    },
    pais: {
      type: String,
      required: [true, 'El país es obligatorio'],
      trim: true,
      maxlength: [100, 'El país no puede superar los 100 caracteres'],
    },
    esPredeterminada: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Consulta principal: "direcciones de este usuario de este tipo" (Requisitos 12.1, 14.5).
AddressSchema.index({ userId: 1, tipo: 1 });

module.exports = mongoose.model('Address', AddressSchema);
