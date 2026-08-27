import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { handleAvatarUpload, MAX_FILE_SIZE_BYTES } from '../../src/middleware/uploadAvatar.js';

function buildApp() {
  const app = express();

  app.post('/avatar', handleAvatarUpload, (req, res) => {
    res.status(200).json({ ok: true, mimetype: req.file.mimetype, size: req.file.size });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ code: err.status || 500, message: err.message });
  });

  return app;
}

describe('src/middleware/uploadAvatar.js', () => {
  it('acepta una imagen JPEG válida y expone req.file al siguiente handler', async () => {
    const app = buildApp();

    const res = await request(app)
      .post('/avatar')
      .attach('avatar', Buffer.from([0xff, 0xd8, 0xff, 0xdb]), { filename: 'foto.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.mimetype).toBe('image/jpeg');
  });

  it('acepta PNG y WEBP', async () => {
    const app = buildApp();

    const resPng = await request(app)
      .post('/avatar')
      .attach('avatar', Buffer.from([0x89, 0x50, 0x4e, 0x47]), { filename: 'foto.png', contentType: 'image/png' });
    expect(resPng.status).toBe(200);

    const resWebp = await request(app)
      .post('/avatar')
      .attach('avatar', Buffer.from([0x52, 0x49, 0x46, 0x46]), { filename: 'foto.webp', contentType: 'image/webp' });
    expect(resWebp.status).toBe(200);
  });

  it('rechaza con 400 un tipo de archivo no permitido', async () => {
    const app = buildApp();

    const res = await request(app)
      .post('/avatar')
      .attach('avatar', Buffer.from('contenido de texto'), { filename: 'archivo.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
  });

  it('rechaza con 400 una imagen que supera el límite de 5MB', async () => {
    const app = buildApp();
    const bigBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1024, 1);

    const res = await request(app)
      .post('/avatar')
      .attach('avatar', bigBuffer, { filename: 'foto.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/5MB/);
  });

  it('rechaza con 400 cuando no se envía ningún archivo', async () => {
    const app = buildApp();

    const res = await request(app).post('/avatar').field('otro', 'valor');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/ninguna imagen/);
  });
});
