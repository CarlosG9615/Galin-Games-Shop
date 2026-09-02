import { describe, it, expect } from 'vitest';
import Game from '../../src/models/Game.js';

function baseGame(overrides = {}) {
  return new Game({
    nombre: 'Assassin\'s Creed Black Flag Resynced',
    slug: 'assassins-creed-black-flag-resynced',
    descripcion: 'Reedición del clásico de piratas.',
    imagenPortada: 'https://res.cloudinary.com/demo/games/assassins.jpg',
    fechaEstreno: new Date('2026-07-09'),
    plataformaDestacada: 'PC',
    plataformas: [
      { plataforma: 'PC', formatos: ['digital'], precio: 59.99, stock: 10 },
      { plataforma: 'PlayStation', formatos: ['fisico', 'digital'], precio: 69.99, stock: 5 },
    ],
    ...overrides,
  });
}

describe('src/models/Game.js', () => {
  it('valida correctamente con todos los campos obligatorios', async () => {
    const game = baseGame();
    await expect(game.validate()).resolves.toBeUndefined();
  });

  it('falla si falta el nombre', async () => {
    const game = baseGame({ nombre: undefined });
    await expect(game.validate()).rejects.toMatchObject({ errors: { nombre: expect.anything() } });
  });

  it('falla si falta la descripción', async () => {
    const game = baseGame({ descripcion: undefined });
    await expect(game.validate()).rejects.toMatchObject({ errors: { descripcion: expect.anything() } });
  });

  it('falla si no tiene ninguna plataforma disponible', async () => {
    const game = baseGame({ plataformas: [] });
    await expect(game.validate()).rejects.toMatchObject({ errors: { plataformas: expect.anything() } });
  });

  it('imagenWallpaper y videoPreviewUrl son null por defecto', () => {
    const game = baseGame();
    expect(game.imagenWallpaper).toBeNull();
    expect(game.videoPreviewUrl).toBeNull();
  });

  it('rechaza que la plataforma PC tenga formato físico', async () => {
    const game = baseGame({
      plataformas: [{ plataforma: 'PC', formatos: ['fisico'], precio: 10, stock: 0 }],
    });
    await expect(game.validate()).rejects.toMatchObject({
      errors: { 'plataformas.0.formatos': expect.anything() },
    });
  });

  it('rechaza que la plataforma PC tenga ambos formatos', async () => {
    const game = baseGame({
      plataformas: [{ plataforma: 'PC', formatos: ['fisico', 'digital'], precio: 10, stock: 0 }],
    });
    await expect(game.validate()).rejects.toMatchObject({
      errors: { 'plataformas.0.formatos': expect.anything() },
    });
  });

  it('permite que PlayStation tenga formato físico y digital a la vez', async () => {
    const game = baseGame({
      plataformaDestacada: 'PlayStation',
      plataformas: [{ plataforma: 'PlayStation', formatos: ['fisico', 'digital'], precio: 10, stock: 0 }],
    });
    await expect(game.validate()).resolves.toBeUndefined();
  });

  it('rechaza un precio negativo', async () => {
    const game = baseGame({
      plataformas: [{ plataforma: 'PC', formatos: ['digital'], precio: -5, stock: 0 }],
    });
    await expect(game.validate()).rejects.toMatchObject({
      errors: { 'plataformas.0.precio': expect.anything() },
    });
  });

  it('rechaza un stock negativo', async () => {
    const game = baseGame({
      plataformas: [{ plataforma: 'PC', formatos: ['digital'], precio: 10, stock: -1 }],
    });
    await expect(game.validate()).rejects.toMatchObject({
      errors: { 'plataformas.0.stock': expect.anything() },
    });
  });

  it('stock por defecto es 0', () => {
    const game = baseGame({
      plataformas: [{ plataforma: 'PC', formatos: ['digital'], precio: 10 }],
    });
    expect(game.plataformas[0].stock).toBe(0);
  });

  it('rechaza plataformaDestacada si no está entre las plataformas disponibles del juego', async () => {
    const game = baseGame({ plataformaDestacada: 'Xbox' });
    await expect(game.validate()).rejects.toMatchObject({
      errors: { plataformaDestacada: expect.anything() },
    });
  });

  it('permite plataformaDestacada null', async () => {
    const game = baseGame({ plataformaDestacada: null });
    await expect(game.validate()).resolves.toBeUndefined();
  });

  it('caracteristicas tiene valores por defecto (online/crossplay/hdr false, mandosCompatibles vacío)', () => {
    const game = baseGame();
    expect(game.caracteristicas.online).toBe(false);
    expect(game.caracteristicas.crossplay).toBe(false);
    expect(game.caracteristicas.hdr).toBe(false);
    expect(game.caracteristicas.mandosCompatibles).toEqual([]);
  });

  it('acepta especificacionesPC con minimas y recomendadas', async () => {
    const game = baseGame({
      plataformas: [
        {
          plataforma: 'PC',
          formatos: ['digital'],
          precio: 10,
          stock: 0,
          especificacionesPC: {
            minimas: { cpu: 'Intel i5', ram: '8 GB', gpu: 'GTX 1060', almacenamiento: '65 GB SSD', sistemaOperativo: 'Windows 10' },
            recomendadas: { cpu: 'Intel i7', ram: '16 GB', gpu: 'RTX 3060', almacenamiento: '65 GB SSD', sistemaOperativo: 'Windows 11' },
          },
        },
      ],
    });
    await expect(game.validate()).resolves.toBeUndefined();
    expect(game.plataformas[0].especificacionesPC.minimas.cpu).toBe('Intel i5');
  });

  it('acepta especificacionesConsola con almacenamiento y notas', async () => {
    const game = baseGame({
      plataformaDestacada: 'PlayStation',
      plataformas: [
        {
          plataforma: 'PlayStation',
          formatos: ['digital'],
          precio: 10,
          stock: 0,
          especificacionesConsola: { almacenamiento: '90 GB', notas: ['PS5 Pro Enhanced'] },
        },
      ],
    });
    await expect(game.validate()).resolves.toBeUndefined();
    expect(game.plataformas[0].especificacionesConsola.notas).toEqual(['PS5 Pro Enhanced']);
  });

  it('tiene un índice único sobre slug', () => {
    const indexes = Game.schema.indexes();
    const slugIndex = indexes.find(([def, opts]) => def.slug === 1 && opts && opts.unique);
    expect(slugIndex).toBeDefined();
  });

  it('tiene un índice sobre plataformas.plataforma', () => {
    const indexes = Game.schema.indexes();
    const platformIndex = indexes.find(([def]) => def['plataformas.plataforma'] === 1);
    expect(platformIndex).toBeDefined();
  });
});
