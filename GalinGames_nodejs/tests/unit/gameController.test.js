import { describe, it, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import { createGameController } from '../../src/controllers/gameController.js';

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function buildController(overrides = {}) {
  const Game = {
    find: vi.fn(),
    findById: vi.fn(),
    ...overrides.Game,
  };
  const GameStockSubscription = {
    create: vi.fn(),
    ...overrides.GameStockSubscription,
  };

  const controller = createGameController({ Game, GameStockSubscription });

  return { controller, Game, GameStockSubscription };
}

const VALID_ID = new mongoose.Types.ObjectId().toString();

function gameDoc(overrides = {}) {
  return {
    _id: VALID_ID,
    nombre: "Assassin's Creed Black Flag Resynced",
    slug: 'assassins-creed-black-flag-resynced',
    descripcion: 'Sinopsis del juego.',
    imagenPortada: 'https://cdn/portada.jpg',
    imagenWallpaper: null,
    videoPreviewUrl: null,
    fechaEstreno: new Date('2020-01-01'),
    plataformaDestacada: 'PC',
    caracteristicas: { online: true, crossplay: false, hdr: false, mandosCompatibles: [] },
    plataformas: [
      { plataforma: 'PC', formatos: ['digital'], precio: 59.99, stock: 10 },
      { plataforma: 'PlayStation', formatos: ['fisico', 'digital'], precio: 69.99, stock: 0 },
    ],
    ...overrides,
  };
}

describe('gameController.listDestacados', () => {
  it('devuelve la proyección reducida con plataforma/precio según plataformaDestacada', async () => {
    const { controller, Game } = buildController({
      Game: { find: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValueOnce([gameDoc()]) }) },
    });

    const req = {};
    const res = mockRes();
    const next = vi.fn();

    await controller.listDestacados(req, res, next);

    expect(Game.find).toHaveBeenCalledWith({ plataformaDestacada: { $ne: null } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      {
        id: VALID_ID,
        nombre: "Assassin's Creed Black Flag Resynced",
        slug: 'assassins-creed-black-flag-resynced',
        imagenPortada: 'https://cdn/portada.jpg',
        plataforma: 'PC',
        precio: 59.99,
      },
    ]);
  });
});

describe('gameController.listPorPlataforma', () => {
  it('devuelve 404 si el slug de plataforma no es válido', async () => {
    const { controller } = buildController();
    const req = { params: { plataforma: 'switch' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.listPorPlataforma(req, res, next);

    expect(next.mock.calls[0][0].status).toBe(404);
  });

  it('devuelve la proyección reducida con el precio de esa plataforma', async () => {
    const { controller, Game } = buildController({
      Game: { find: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValueOnce([gameDoc()]) }) },
    });

    const req = { params: { plataforma: 'playstation' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.listPorPlataforma(req, res, next);

    expect(Game.find).toHaveBeenCalledWith({ 'plataformas.plataforma': 'PlayStation' });
    expect(res.json).toHaveBeenCalledWith([
      {
        id: VALID_ID,
        nombre: "Assassin's Creed Black Flag Resynced",
        slug: 'assassins-creed-black-flag-resynced',
        imagenPortada: 'https://cdn/portada.jpg',
        precio: 69.99,
      },
    ]);
  });
});

describe('gameController.getDetalle', () => {
  it('devuelve 404 si el id no es un ObjectId válido', async () => {
    const { controller, Game } = buildController();
    const req = { params: { id: 'no-es-un-id' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.getDetalle(req, res, next);

    expect(next.mock.calls[0][0].status).toBe(404);
    expect(Game.findById).not.toHaveBeenCalled();
  });

  it('devuelve 404 si el juego no existe', async () => {
    const { controller } = buildController({ Game: { findById: vi.fn().mockResolvedValueOnce(null) } });
    const req = { params: { id: VALID_ID } };
    const res = mockRes();
    const next = vi.fn();

    await controller.getDetalle(req, res, next);

    expect(next.mock.calls[0][0].status).toBe(404);
  });

  it('devuelve la proyección completa con estrenado:true si la fecha de estreno ya pasó', async () => {
    const { controller } = buildController({ Game: { findById: vi.fn().mockResolvedValueOnce(gameDoc()) } });
    const req = { params: { id: VALID_ID } };
    const res = mockRes();
    const next = vi.fn();

    await controller.getDetalle(req, res, next);

    const body = res.json.mock.calls[0][0];
    expect(body.estrenado).toBe(true);
    expect(body.descripcion).toBe('Sinopsis del juego.');
    expect(body.plataformas).toHaveLength(2);
  });

  it('devuelve estrenado:false si la fecha de estreno es futura', async () => {
    const futura = gameDoc({ fechaEstreno: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) });
    const { controller } = buildController({ Game: { findById: vi.fn().mockResolvedValueOnce(futura) } });
    const req = { params: { id: VALID_ID } };
    const res = mockRes();
    const next = vi.fn();

    await controller.getDetalle(req, res, next);

    expect(res.json.mock.calls[0][0].estrenado).toBe(false);
  });
});

describe('gameController.suscribirNotificacion', () => {
  it('devuelve 404 si el id no es un ObjectId válido', async () => {
    const { controller } = buildController();
    const req = { params: { id: 'no-es-un-id' }, body: { plataforma: 'PC' }, user: { userId: 'user-1' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.suscribirNotificacion(req, res, next);

    expect(next.mock.calls[0][0].status).toBe(404);
  });

  it('devuelve 404 si el juego no existe', async () => {
    const { controller } = buildController({
      Game: { findById: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValueOnce(null) }) },
    });
    const req = { params: { id: VALID_ID }, body: { plataforma: 'PC' }, user: { userId: 'user-1' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.suscribirNotificacion(req, res, next);

    expect(next.mock.calls[0][0].status).toBe(404);
  });

  it('devuelve 400 si la plataforma no está disponible para ese juego', async () => {
    const { controller } = buildController({
      Game: { findById: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValueOnce(gameDoc()) }) },
    });
    const req = { params: { id: VALID_ID }, body: { plataforma: 'Xbox' }, user: { userId: 'user-1' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.suscribirNotificacion(req, res, next);

    expect(next.mock.calls[0][0].status).toBe(400);
  });

  it('devuelve 400 si esa combinación ya tiene stock', async () => {
    const { controller } = buildController({
      Game: { findById: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValueOnce(gameDoc()) }) },
    });
    const req = { params: { id: VALID_ID }, body: { plataforma: 'PC' }, user: { userId: 'user-1' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.suscribirNotificacion(req, res, next);

    expect(next.mock.calls[0][0].status).toBe(400);
  });

  it('crea la suscripción y devuelve 201 cuando la combinación no tiene stock', async () => {
    const { controller, GameStockSubscription } = buildController({
      Game: { findById: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValueOnce(gameDoc()) }) },
      GameStockSubscription: { create: vi.fn().mockResolvedValueOnce({}) },
    });
    const req = { params: { id: VALID_ID }, body: { plataforma: 'PlayStation' }, user: { userId: 'user-1' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.suscribirNotificacion(req, res, next);

    expect(GameStockSubscription.create).toHaveBeenCalledWith({ userId: 'user-1', gameId: VALID_ID, plataforma: 'PlayStation' });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('devuelve 200 con yaSuscrito:true si ya existía la suscripción (error 11000)', async () => {
    const duplicado = new Error('duplicado');
    duplicado.code = 11000;
    const { controller } = buildController({
      Game: { findById: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValueOnce(gameDoc()) }) },
      GameStockSubscription: { create: vi.fn().mockRejectedValueOnce(duplicado) },
    });
    const req = { params: { id: VALID_ID }, body: { plataforma: 'PlayStation' }, user: { userId: 'user-1' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.suscribirNotificacion(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: expect.any(String), yaSuscrito: true });
  });

  it('propaga cualquier otro error a next', async () => {
    const otroError = new Error('fallo inesperado');
    const { controller } = buildController({
      Game: { findById: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValueOnce(gameDoc()) }) },
      GameStockSubscription: { create: vi.fn().mockRejectedValueOnce(otroError) },
    });
    const req = { params: { id: VALID_ID }, body: { plataforma: 'PlayStation' }, user: { userId: 'user-1' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.suscribirNotificacion(req, res, next);

    expect(next).toHaveBeenCalledWith(otroError);
  });
});
