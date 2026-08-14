import { describe, it, expect } from 'vitest';
import { requireField, isEmpty, sanitizeResponse, AppError } from '../../src/utils/nullGuard.js';

describe('src/utils/nullGuard.js', () => {
  it('requireField lanza AppError con status 400 si el valor es null', () => {
    expect(() => requireField(null, 'x')).toThrow(AppError);
    try {
      requireField(null, 'x');
    } catch (err) {
      expect(err.status).toBe(400);
    }
  });

  it('requireField lanza AppError con status 400 si el valor es undefined', () => {
    expect(() => requireField(undefined, 'x')).toThrow(AppError);
  });

  it('requireField lanza AppError con status 400 si el valor es solo espacios', () => {
    expect(() => requireField('  ', 'x')).toThrow(AppError);
  });

  it('requireField no lanza si el valor es válido', () => {
    expect(() => requireField('valor', 'x')).not.toThrow();
  });

  it('isEmpty devuelve true para vacío y false para no vacío', () => {
    expect(isEmpty('')).toBe(true);
    expect(isEmpty('a')).toBe(false);
  });

  it('sanitizeResponse elimina claves con valor undefined', () => {
    expect(sanitizeResponse({ a: 1, b: undefined })).toEqual({ a: 1 });
  });
});
