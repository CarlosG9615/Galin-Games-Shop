import { describe, it, expect } from 'vitest';
import { resolvePlatform } from '../../src/utils/platformSlug.js';

describe('src/utils/platformSlug.js', () => {
  it.each([
    ['pc', 'PC'],
    ['playstation', 'PlayStation'],
    ['xbox', 'Xbox'],
    ['nintendo', 'Nintendo'],
  ])('resolvePlatform("%s") devuelve "%s"', (slug, expected) => {
    expect(resolvePlatform(slug)).toBe(expected);
  });

  it('es insensible a mayúsculas/minúsculas', () => {
    expect(resolvePlatform('PC')).toBe('PC');
    expect(resolvePlatform('PlayStation')).toBe('PlayStation');
  });

  it('devuelve null si el slug no coincide con ninguna plataforma', () => {
    expect(resolvePlatform('switch')).toBeNull();
    expect(resolvePlatform('mac')).toBeNull();
  });

  it('devuelve null si el valor no es un string', () => {
    expect(resolvePlatform(undefined)).toBeNull();
    expect(resolvePlatform(null)).toBeNull();
    expect(resolvePlatform(123)).toBeNull();
  });
});
