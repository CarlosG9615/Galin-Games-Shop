const mongoose = require('mongoose');

const { Schema } = mongoose;

const PLATAFORMAS = ['PC', 'PlayStation', 'Xbox', 'Nintendo'];
const FORMATOS = ['fisico', 'digital'];

const EspecificacionesPerfilSchema = new Schema(
  {
    cpu: { type: String, trim: true },
    ram: { type: String, trim: true },
    gpu: { type: String, trim: true },
    almacenamiento: { type: String, trim: true },
    sistemaOperativo: { type: String, trim: true },
  },
  { _id: false },
);

const EspecificacionesPCSchema = new Schema(
  {
    minimas: { type: EspecificacionesPerfilSchema, default: undefined },
    recomendadas: { type: EspecificacionesPerfilSchema, default: undefined },
  },
  { _id: false },
);

const EspecificacionesConsolaSchema = new Schema(
  {
    almacenamiento: { type: String, trim: true },
    notas: { type: [String], default: [] },
  },
  { _id: false },
);

const DisponibilidadPlataformaSchema = new Schema(
  {
    plataforma: {
      type: String,
      required: [true, 'La plataforma es obligatoria'],
      enum: { values: PLATAFORMAS, message: 'Plataforma no válida' },
    },
    formatos: {
      type: [String],
      required: [true, 'Los formatos disponibles son obligatorios'],
      enum: { values: FORMATOS, message: 'Formato no válido' },
      validate: [
        {
          validator: (value) => Array.isArray(value) && value.length >= 1,
          message: 'Debe indicarse al menos un formato disponible',
        },
        {
          // En PC solo existe el formato digital (Requisito 11.1).
          validator: function validatePcSoloDigital(value) {
            if (this.plataforma !== 'PC') return true;
            return Array.isArray(value) && value.length === 1 && value[0] === 'digital';
          },
          message: 'En la plataforma PC el único formato disponible es "digital"',
        },
      ],
    },
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'El stock no puede ser negativo'],
    },
    especificacionesPC: { type: EspecificacionesPCSchema, default: undefined },
    especificacionesConsola: { type: EspecificacionesConsolaSchema, default: undefined },
  },
  { _id: false },
);

const CaracteristicasSchema = new Schema(
  {
    jugadores: {
      tipo: {
        type: String,
        enum: { values: ['individual', 'multijugador'], message: 'Tipo de jugadores no válido' },
      },
      maximo: {
        type: Number,
        min: [1, 'El número máximo de jugadores debe ser al menos 1'],
      },
    },
    online: { type: Boolean, default: false },
    crossplay: { type: Boolean, default: false },
    hdr: { type: Boolean, default: false },
    mandosCompatibles: { type: [String], default: [] },
  },
  { _id: false },
);

const GameSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del juego es obligatorio'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'El slug del juego es obligatorio'],
      trim: true,
      lowercase: true,
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción del juego es obligatoria'],
    },
    imagenPortada: {
      type: String,
      required: [true, 'La imagen de portada es obligatoria'],
    },
    imagenWallpaper: {
      type: String,
      default: null,
    },
    videoPreviewUrl: {
      type: String,
      default: null,
    },
    fechaEstreno: {
      type: Date,
      required: [true, 'La fecha de estreno es obligatoria'],
    },
    plataformaDestacada: {
      type: String,
      enum: { values: PLATAFORMAS, message: 'Plataforma destacada no válida' },
      default: null,
    },
    caracteristicas: {
      type: CaracteristicasSchema,
      default: () => ({}),
    },
    plataformas: {
      type: [DisponibilidadPlataformaSchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= 1,
        message: 'El juego debe tener al menos una plataforma disponible',
      },
    },
  },
  { timestamps: true },
);

// plataformaDestacada no se puede expresar como un enum fijo porque depende de qué
// plataformas tenga realmente ese juego (design.md → Data Models: Game.plataformaDestacada).
GameSchema.path('plataformaDestacada').validate(function validatePlataformaDestacada(value) {
  if (value === null || value === undefined) return true;
  return this.plataformas.some((disponibilidad) => disponibilidad.plataforma === value);
}, 'La plataforma destacada debe estar entre las plataformas disponibles del juego');

// Consulta principal del seed/script de stock (Requisito 14... y design.md → Data Models).
GameSchema.index({ slug: 1 }, { unique: true });
// Consulta de la Vista de Plataforma (Requisito 15.2).
GameSchema.index({ 'plataformas.plataforma': 1 });

module.exports = mongoose.model('Game', GameSchema);
