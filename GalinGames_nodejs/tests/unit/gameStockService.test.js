import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGameStockService } from '../../src/services/gameStockService.js';

function buildService(overrides = {}) {
  const Game = {
    findById: vi.fn(),
    ...overrides.Game,
  };
  const GameStockSubscription = {
    find: vi.fn(),
    deleteOne: vi.fn().mockResolvedValue(undefined),
    ...overrides.GameStockSubscription,
  };
  const emailService = {
    sendStockAvailableEmail: vi.fn().mockResolvedValue(undefined),
    ...overrides.emailService,
  };

  const service = createGameStockService({ Game, GameStockSubscription, emailService });

  return { service, Game, GameStockSubscription, emailService };
}

describe('src/services/gameStockService.js — notifySubscribers', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('no hace nada si el juego no existe', async () => {
    const { service, Game, GameStockSubscription } = buildService({
      Game: { findById: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValueOnce(null) }) },
    });

    await service.notifySubscribers('game-1', 'PC');

    expect(Game.findById).toHaveBeenCalledWith('game-1');
    expect(GameStockSubscription.find).not.toHaveBeenCalled();
  });

  it('no hace nada si no hay suscripciones para esa combinación', async () => {
    const { service, GameStockSubscription, emailService } = buildService({
      Game: { findById: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValueOnce({ nombre: 'Juego X' }) }) },
      GameStockSubscription: { find: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValueOnce([]) }) },
    });

    await service.notifySubscribers('game-1', 'PC');

    expect(GameStockSubscription.find).toHaveBeenCalledWith({ gameId: 'game-1', plataforma: 'PC' });
    expect(emailService.sendStockAvailableEmail).not.toHaveBeenCalled();
  });

  it('envía un email a cada suscriptor y borra su suscripción', async () => {
    const suscripciones = [
      { _id: 'sub-1', userId: { email: 'a@example.com', username: 'ana' } },
      { _id: 'sub-2', userId: { email: 'b@example.com', username: 'bruno' } },
    ];
    const { service, GameStockSubscription, emailService } = buildService({
      Game: { findById: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValueOnce({ nombre: 'Dragon Ball: Sparking! Zero' }) }) },
      GameStockSubscription: { find: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValueOnce(suscripciones) }) },
    });

    await service.notifySubscribers('game-1', 'PC');

    expect(emailService.sendStockAvailableEmail).toHaveBeenCalledTimes(2);
    expect(emailService.sendStockAvailableEmail).toHaveBeenCalledWith(
      'a@example.com',
      'ana',
      'Dragon Ball: Sparking! Zero',
      expect.stringContaining('/juegos/detalle/game-1?plataforma=PC'),
    );
    expect(GameStockSubscription.deleteOne).toHaveBeenCalledWith({ _id: 'sub-1' });
    expect(GameStockSubscription.deleteOne).toHaveBeenCalledWith({ _id: 'sub-2' });
  });

  it('ignora una suscripción cuyo usuario ya no existe (userId sin populate)', async () => {
    const { service, GameStockSubscription, emailService } = buildService({
      Game: { findById: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValueOnce({ nombre: 'Juego X' }) }) },
      GameStockSubscription: { find: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValueOnce([{ _id: 'sub-1', userId: null }]) }) },
    });

    await service.notifySubscribers('game-1', 'PC');

    expect(emailService.sendStockAvailableEmail).not.toHaveBeenCalled();
    expect(GameStockSubscription.deleteOne).not.toHaveBeenCalled();
  });

  it('si el envío de un email falla, no borra esa suscripción y continúa con las demás', async () => {
    const suscripciones = [
      { _id: 'sub-1', userId: { email: 'a@example.com', username: 'ana' } },
      { _id: 'sub-2', userId: { email: 'b@example.com', username: 'bruno' } },
    ];
    const sendStockAvailableEmail = vi.fn().mockRejectedValueOnce(new Error('SMTP down')).mockResolvedValueOnce(undefined);
    const { service, GameStockSubscription } = buildService({
      Game: { findById: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValueOnce({ nombre: 'Juego X' }) }) },
      GameStockSubscription: { find: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValueOnce(suscripciones) }) },
      emailService: { sendStockAvailableEmail },
    });

    await service.notifySubscribers('game-1', 'PC');

    expect(sendStockAvailableEmail).toHaveBeenCalledTimes(2);
    expect(GameStockSubscription.deleteOne).toHaveBeenCalledTimes(1);
    expect(GameStockSubscription.deleteOne).toHaveBeenCalledWith({ _id: 'sub-2' });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
