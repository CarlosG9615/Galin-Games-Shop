import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCloudinaryService } from '../../src/services/cloudinaryService.js';

function buildStreamClient({ error, result } = {}) {
  const endMock = vi.fn();
  const uploadStreamMock = vi.fn((options, callback) => {
    // Simula el comportamiento async del stream de Cloudinary: el callback se
    // invoca cuando el "stream" termina, no de forma síncrona.
    setImmediate(() => callback(error || null, error ? null : result));
    return { end: endMock };
  });

  return {
    uploader: {
      upload_stream: uploadStreamMock,
      destroy: vi.fn().mockResolvedValue({ result: 'ok' }),
    },
    endMock,
    uploadStreamMock,
  };
}

describe('src/services/cloudinaryService.js', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('uploadAvatar resuelve con url y publicId cuando Cloudinary responde con éxito', async () => {
    const client = buildStreamClient({
      result: { secure_url: 'https://res.cloudinary.com/demo/avatar.jpg', public_id: 'users/user1/abc' },
    });
    const { uploadAvatar } = createCloudinaryService(client);

    const result = await uploadAvatar(Buffer.from('fake-image'), 'user1');

    expect(result).toEqual({ url: 'https://res.cloudinary.com/demo/avatar.jpg', publicId: 'users/user1/abc' });
    expect(client.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({ folder: 'users/user1', resource_type: 'image' }),
      expect.any(Function),
    );
    expect(client.endMock).toHaveBeenCalledWith(Buffer.from('fake-image'));
  });

  it('uploadAvatar rechaza si Cloudinary devuelve error', async () => {
    const client = buildStreamClient({ error: new Error('Cloudinary caído') });
    const { uploadAvatar } = createCloudinaryService(client);

    await expect(uploadAvatar(Buffer.from('x'), 'user1')).rejects.toThrow('Cloudinary caído');
  });

  it('deleteAsset no llama a destroy si publicId es null', async () => {
    const client = buildStreamClient();
    const { deleteAsset } = createCloudinaryService(client);

    await deleteAsset(null);

    expect(client.uploader.destroy).not.toHaveBeenCalled();
  });

  it('deleteAsset llama a destroy con el publicId dado', async () => {
    const client = buildStreamClient();
    const { deleteAsset } = createCloudinaryService(client);

    await deleteAsset('users/user1/abc');

    expect(client.uploader.destroy).toHaveBeenCalledWith('users/user1/abc');
  });

  it('deleteAsset no lanza si destroy falla (best-effort)', async () => {
    const client = buildStreamClient();
    client.uploader.destroy.mockRejectedValueOnce(new Error('timeout'));
    const { deleteAsset } = createCloudinaryService(client);

    await expect(deleteAsset('users/user1/abc')).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
