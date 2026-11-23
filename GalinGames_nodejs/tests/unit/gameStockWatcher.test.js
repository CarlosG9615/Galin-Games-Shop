import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGameStockWatcher } from '../../src/services/gameStockWatcher.js';

function buildFakeChangeStream() {
  const handlers = {};
  return {
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
    close: vi.fn().mockResolvedValue(undefined),
    emit: async (event, payload) => handlers[event] && handlers[event](payload),
  };
}

function buildWatcher(overrides = {}) {
  const changeStream = overrides.changeStream || buildFakeChangeStream();
  const Game = { watch: vi.fn().mockReturnValue(changeStream), ...overrides.Game };
  const gameStockService = { notifySubscribers: vi.fn().mockResolvedValue(undefined), ...overrides.gameStockService };

  const watcher = createGameStockWatcher({ Game, gameStockService });

  return { watcher, Game, gameStockService, changeStream };
}

describe('src/services/gameStockWatcher.js', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('start() abre un change stream sobre Game con fullDocument: updateLookup', () => {
    const { watcher, Game } = buildWatcher();

    watcher.start();

    expect(Game.watch).toHaveBeenCalledWith(
      [{ $match: { operationType: { $in: ['insert', 'update', 'replace'] } } }],
      { fullDocument: 'updateLookup' },
    );
  });

  it('notifica cada plataforma con stock > 0 del documento cambiado', async () => {
    const { watcher, gameStockService, changeStream } = buildWatcher();
    watcher.start();

    await changeStream.emit('change', {
      fullDocument: {
        _id: 'game-1',
        plataformas: [
          { plataforma: 'PC', stock: 0 },
          { plataforma: 'PlayStation', stock: 5 },
          { plataforma: 'Xbox', stock: 2 },
        ],
      },
    });

    expect(gameStockService.notifySubscribers).toHaveBeenCalledTimes(2);
    expect(gameStockService.notifySubscribers).toHaveBeenCalledWith('game-1', 'PlayStation');
    expect(gameStockService.notifySubscribers).toHaveBeenCalledWith('game-1', 'Xbox');
    expect(gameStockService.notifySubscribers).not.toHaveBeenCalledWith('game-1', 'PC');
  });

  it('no hace nada si el evento no trae fullDocument (p. ej. un delete)', async () => {
    const { watcher, gameStockService, changeStream } = buildWatcher();
    watcher.start();

    await changeStream.emit('change', {});

    expect(gameStockService.notifySubscribers).not.toHaveBeenCalled();
  });

  it('si notifySubscribers falla para una plataforma, no interrumpe las demás', async () => {
    const notifySubscribers = vi.fn().mockRejectedValueOnce(new Error('SMTP down')).mockResolvedValueOnce(undefined);
    const { watcher, changeStream } = buildWatcher({ gameStockService: { notifySubscribers } });
    watcher.start();

    await changeStream.emit('change', {
      fullDocument: {
        _id: 'game-1',
        plataformas: [
          { plataforma: 'PC', stock: 3 },
          { plataforma: 'Xbox', stock: 1 },
        ],
      },
    });

    expect(notifySubscribers).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('registra un listener de error en el change stream', () => {
    const { watcher, changeStream } = buildWatcher();

    watcher.start();

    expect(changeStream.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('stop() cierra el change stream si estaba abierto', async () => {
    const { watcher, changeStream } = buildWatcher();
    watcher.start();

    await watcher.stop();

    expect(changeStream.close).toHaveBeenCalledTimes(1);
  });

  it('stop() no falla si nunca se llamó a start()', async () => {
    const { watcher, changeStream } = buildWatcher();

    await expect(watcher.stop()).resolves.toBeUndefined();
    expect(changeStream.close).not.toHaveBeenCalled();
  });
});
