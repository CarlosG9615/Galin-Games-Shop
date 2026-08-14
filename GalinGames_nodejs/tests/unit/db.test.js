import { describe, it, expect, vi, afterEach } from 'vitest';
import mongoose from 'mongoose';

describe('src/config/db.js', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rechaza y llama a process.exit(1) cuando la conexión a MongoDB falla', async () => {
    const connectSpy = vi.spyOn(mongoose, 'connect').mockRejectedValueOnce(new Error('connection refused'));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const connectDB = (await import('../../src/config/db.js')).default;
    await connectDB();

    expect(connectSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('[DB] Error de conexión:', 'connection refused');
  });
});
