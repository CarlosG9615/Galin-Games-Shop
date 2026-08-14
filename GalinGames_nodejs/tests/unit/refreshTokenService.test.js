import { describe, it, expect } from 'vitest';
import { generateRefreshToken, verifyRefreshToken } from '../../src/services/refreshTokenService.js';

describe('src/services/refreshTokenService.js', () => {
  it('generateRefreshToken() devuelve un token y un hash distintos entre sí', () => {
    const { token, hash } = generateRefreshToken();
    expect(token).not.toBe(hash);
    expect(typeof token).toBe('string');
    expect(typeof hash).toBe('string');
  });

  it('verifyRefreshToken devuelve true cuando el hash es correcto', () => {
    const { token, hash } = generateRefreshToken();
    expect(verifyRefreshToken(token, hash)).toBe(true);
  });

  it('verifyRefreshToken devuelve false cuando el hash es incorrecto', () => {
    const { token } = generateRefreshToken();
    const { hash: otherHash } = generateRefreshToken();
    expect(verifyRefreshToken(token, otherHash)).toBe(false);
  });

  it('dos llamadas a generateRefreshToken() producen tokens diferentes', () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a.token).not.toBe(b.token);
  });
});
