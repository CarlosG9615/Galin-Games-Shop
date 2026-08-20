import { describe, it, expect } from 'vitest';
import { generateVerificationToken, verifyVerificationToken } from '../../src/services/emailVerificationService.js';

describe('src/services/emailVerificationService.js', () => {
  it('generateVerificationToken() devuelve un token y un hash distintos entre sí', () => {
    const { token, hash } = generateVerificationToken();
    expect(token).not.toBe(hash);
    expect(typeof token).toBe('string');
    expect(typeof hash).toBe('string');
  });

  it('verifyVerificationToken devuelve true cuando el hash es correcto', () => {
    const { token, hash } = generateVerificationToken();
    expect(verifyVerificationToken(token, hash)).toBe(true);
  });

  it('verifyVerificationToken devuelve false cuando el hash es incorrecto', () => {
    const { token } = generateVerificationToken();
    const { hash: otherHash } = generateVerificationToken();
    expect(verifyVerificationToken(token, otherHash)).toBe(false);
  });

  it('dos llamadas a generateVerificationToken() producen tokens diferentes', () => {
    const a = generateVerificationToken();
    const b = generateVerificationToken();
    expect(a.token).not.toBe(b.token);
  });
});
