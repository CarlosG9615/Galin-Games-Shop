const multer = require('multer');
const AppError = require('../utils/AppError');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB (Requisito 6.2)

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new AppError('El archivo debe ser una imagen JPEG, PNG o WEBP', 400));
  }
  return cb(null, true);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
}).single('avatar');

// Envuelve multer para traducir sus errores (tamaño excedido, tipo inválido, campo
// ausente) a la respuesta JSON homogénea del resto de la API, en vez de dejarlos
// llegar como error genérico de Express (Requisito 6.2).
function handleAvatarUpload(req, res, next) {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ code: 400, message: 'La imagen no puede superar los 5MB' });
      }
      return res.status(400).json({ code: 400, message: 'No se pudo procesar la imagen' });
    }

    if (err) {
      return next(err); // AppError del fileFilter -> globalErrorHandler
    }

    if (!req.file) {
      return res.status(400).json({ code: 400, message: 'No se ha recibido ninguna imagen' });
    }

    return next();
  });
}

module.exports = { handleAvatarUpload, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES };
