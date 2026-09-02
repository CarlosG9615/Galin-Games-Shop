const cloudinary = require('cloudinary').v2;
const env = require('../config/env');

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// Inyección del cliente cloudinary: permite a los tests sustituirlo por un doble de
// prueba, igual que createEmailService hace con el transporter de nodemailer.
function createCloudinaryService(client) {
  async function uploadImage(buffer, folder) {
    return new Promise((resolve, reject) => {
      const stream = client.uploader.upload_stream({ folder, resource_type: 'image', overwrite: true }, (error, result) => {
        if (error) return reject(error);
        return resolve({ url: result.secure_url, publicId: result.public_id });
      });
      stream.end(buffer);
    });
  }

  // Carpeta 'users' ya creada en el dashboard de Cloudinary para volcar ahí todas las
  // imágenes de usuario (avatares); un subdirectorio por userId mantiene los assets de
  // cada usuario agrupados dentro de esa carpeta.
  async function uploadAvatar(buffer, userId) {
    return uploadImage(buffer, `users/${userId}`);
  }

  async function deleteAsset(publicId) {
    if (!publicId) return;

    try {
      await client.uploader.destroy(publicId);
    } catch (err) {
      // Best-effort (Requisito 6.3, design.md → Security): un fallo al borrar el
      // avatar anterior en Cloudinary no debe impedir guardar el nuevo.
      console.error(`[${new Date().toISOString()}] cloudinaryService.deleteAsset`, err);
    }
  }

  return { uploadImage, uploadAvatar, deleteAsset };
}

const { uploadImage, uploadAvatar, deleteAsset } = createCloudinaryService(cloudinary);

module.exports = { uploadImage, uploadAvatar, deleteAsset, createCloudinaryService };
