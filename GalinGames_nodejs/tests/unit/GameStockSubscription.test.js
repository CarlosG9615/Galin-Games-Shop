import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import GameStockSubscription from '../../src/models/GameStockSubscription.js';

function baseSubscription(overrides = {}) {
  return new GameStockSubscription({
    userId: new mongoose.Types.ObjectId(),
    gameId: new mongoose.Types.ObjectId(),
    plataforma: 'PC',
    ...overrides,
  });
}

describe('src/models/GameStockSubscription.js', () => {
  it('valida correctamente con todos los campos obligatorios', async () => {
    const subscription = baseSubscription();
    await expect(subscription.validate()).resolves.toBeUndefined();
  });

  it('falla si falta userId', async () => {
    const subscription = baseSubscription({ userId: undefined });
    await expect(subscription.validate()).rejects.toMatchObject({ errors: { userId: expect.anything() } });
  });

  it('falla si falta gameId', async () => {
    const subscription = baseSubscription({ gameId: undefined });
    await expect(subscription.validate()).rejects.toMatchObject({ errors: { gameId: expect.anything() } });
  });

  it('falla si la plataforma no es una de las 4 válidas', async () => {
    const subscription = baseSubscription({ plataforma: 'Mac' });
    await expect(subscription.validate()).rejects.toMatchObject({ errors: { plataforma: expect.anything() } });
  });

  it('createdAt se rellena por defecto', () => {
    const subscription = baseSubscription();
    expect(subscription.createdAt).toBeInstanceOf(Date);
  });

  it('tiene un índice único compuesto sobre userId, gameId y plataforma', () => {
    const indexes = GameStockSubscription.schema.indexes();
    const compuesto = indexes.find(
      ([def, opts]) => def.userId === 1 && def.gameId === 1 && def.plataforma === 1 && opts && opts.unique,
    );
    expect(compuesto).toBeDefined();
  });
});
