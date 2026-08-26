import { describe, it, expect, vi, afterEach } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

// Todas las claves se dejan siempre definidas (aunque sea con string vacío) para
// que dotenv.config() -que nunca sobreescribe una clave ya presente en process.env-
// no reintroduzca los valores reales de GalinGames_nodejs/.env durante los tests.
const VALID_ENV = {
  JWT_SECRET: 'a'.repeat(32),
  JWT_EXPIRES_IN: '3600',
  REFRESH_TOKEN_SECRET: 'b'.repeat(32),
  REFRESH_TOKEN_EXPIRES_DAYS: '7',
  MONGODB_URI: 'mongodb://localhost:27017/GalinGames',
  PORT: '3001',
  NODE_ENV: 'test',
  ALLOWED_ORIGINS: 'http://localhost:5173',
  EMAIL_USER: 'GalinGamesShop@gmail.com',
  EMAIL_APP_PASSWORD: 'app-password-de-prueba',
  FRONTEND_URL: 'http://localhost:5173',
  BACKEND_URL: 'http://localhost:3001',
  EMAIL_VERIFICATION_EXPIRES_HOURS: '24',
  CLOUDINARY_CLOUD_NAME: 'demo-cloud',
  CLOUDINARY_API_KEY: '123456789012345',
  CLOUDINARY_API_SECRET: 'cloudinary-secret-de-prueba',
};

function setEnv(overrides) {
  process.env = { ...VALID_ENV, ...overrides };
}

async function loadEnvModule() {
  vi.resetModules();
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined);
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const mod = await import('../../src/config/env.js');
  return { exitSpy, errorSpy, env: mod.default ?? mod };
}

describe('src/config/env.js', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it('termina el proceso con código 1 si falta JWT_SECRET', async () => {
    setEnv({ JWT_SECRET: '' });
    const { exitSpy } = await loadEnvModule();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('termina el proceso con código 1 si JWT_SECRET tiene menos de 32 caracteres', async () => {
    setEnv({ JWT_SECRET: 'demasiado-corto' });
    const { exitSpy } = await loadEnvModule();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('termina el proceso con código 1 si falta MONGODB_URI', async () => {
    setEnv({ MONGODB_URI: '' });
    const { exitSpy } = await loadEnvModule();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('termina el proceso con código 1 si falta o es corto REFRESH_TOKEN_SECRET', async () => {
    setEnv({ REFRESH_TOKEN_SECRET: 'corto' });
    const { exitSpy } = await loadEnvModule();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('termina el proceso con código 1 si JWT_EXPIRES_IN supera 86400', async () => {
    setEnv({ JWT_EXPIRES_IN: '90000' });
    const { exitSpy } = await loadEnvModule();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('carga correctamente con variables válidas y aplica el valor por defecto de JWT_EXPIRES_IN (3600) si no está definida', async () => {
    setEnv({ JWT_EXPIRES_IN: '' });
    const { exitSpy, env } = await loadEnvModule();
    expect(exitSpy).not.toHaveBeenCalled();
    expect(env.JWT_EXPIRES_IN).toBe(3600);
    expect(env.MONGODB_URI).toBe(VALID_ENV.MONGODB_URI);
  });

  it('termina el proceso con código 1 si falta EMAIL_USER', async () => {
    setEnv({ EMAIL_USER: '' });
    const { exitSpy } = await loadEnvModule();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('termina el proceso con código 1 si falta EMAIL_APP_PASSWORD', async () => {
    setEnv({ EMAIL_APP_PASSWORD: '' });
    const { exitSpy } = await loadEnvModule();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('termina el proceso con código 1 si falta FRONTEND_URL', async () => {
    setEnv({ FRONTEND_URL: '' });
    const { exitSpy } = await loadEnvModule();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('termina el proceso con código 1 si falta BACKEND_URL', async () => {
    setEnv({ BACKEND_URL: '' });
    const { exitSpy } = await loadEnvModule();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('aplica el valor por defecto de EMAIL_VERIFICATION_EXPIRES_HOURS (24) si no está definida', async () => {
    setEnv({ EMAIL_VERIFICATION_EXPIRES_HOURS: '' });
    const { exitSpy, env } = await loadEnvModule();
    expect(exitSpy).not.toHaveBeenCalled();
    expect(env.EMAIL_VERIFICATION_EXPIRES_HOURS).toBe(24);
  });

  it('termina el proceso con código 1 si falta CLOUDINARY_CLOUD_NAME', async () => {
    setEnv({ CLOUDINARY_CLOUD_NAME: '' });
    const { exitSpy } = await loadEnvModule();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('termina el proceso con código 1 si falta CLOUDINARY_API_KEY', async () => {
    setEnv({ CLOUDINARY_API_KEY: '' });
    const { exitSpy } = await loadEnvModule();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('termina el proceso con código 1 si falta CLOUDINARY_API_SECRET', async () => {
    setEnv({ CLOUDINARY_API_SECRET: '' });
    const { exitSpy } = await loadEnvModule();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('carga correctamente las tres variables de Cloudinary', async () => {
    setEnv({});
    const { exitSpy, env } = await loadEnvModule();
    expect(exitSpy).not.toHaveBeenCalled();
    expect(env.CLOUDINARY_CLOUD_NAME).toBe(VALID_ENV.CLOUDINARY_CLOUD_NAME);
    expect(env.CLOUDINARY_API_KEY).toBe(VALID_ENV.CLOUDINARY_API_KEY);
    expect(env.CLOUDINARY_API_SECRET).toBe(VALID_ENV.CLOUDINARY_API_SECRET);
  });
});
