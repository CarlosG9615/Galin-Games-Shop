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
});
