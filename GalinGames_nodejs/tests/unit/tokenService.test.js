import { describe, it, expect, vi, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken } from '../../src/services/tokenService.js';
import env from '../../src/config/env.js';

describe('src/services/tokenService.js', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generateToken produce un string con tres partes separadas por "."', () => {
    const token = generateToken('user-1', 'admin');
    expect(token.split('.')).toHaveLength(3);
  });

  it('el payload decodificado contiene exactamente userId, username, iat y exp', () => {
    const token = generateToken('user-1', 'admin');
    const decoded = verifyToken(token);
    expect(Object.keys(decoded).sort()).toEqual(['exp', 'iat', 'username', 'userId'].sort());
    expect(decoded.userId).toBe('user-1');
    expect(decoded.username).toBe('admin');
  });

  it('dos tokens generados en instantes distintos producen valores iat distintos', () => {
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1_700_000_000_000);
    const tokenA = generateToken('user-1', 'admin');
    nowSpy.mockReturnValue(1_700_000_005_000);
    const tokenB = generateToken('user-1', 'admin');

    const decodedA = jwt.decode(tokenA);
    const decodedB = jwt.decode(tokenB);
    expect(decodedA.iat).not.toBe(decodedB.iat);
  });

  it('verifyToken lanza TokenExpiredError con un token expirado', () => {
    const expiredToken = jwt.sign({ userId: 'user-1', username: 'admin' }, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: -10,
    });
    expect(() => verifyToken(expiredToken)).toThrow(jwt.TokenExpiredError);
  });

  it('verifyToken lanza JsonWebTokenError con firma manipulada', () => {
    const token = generateToken('user-1', 'admin');
    const tampered = `${token.slice(0, -1)}${token.at(-1) === 'a' ? 'b' : 'a'}`;
    expect(() => verifyToken(tampered)).toThrow(jwt.JsonWebTokenError);
  });
});
