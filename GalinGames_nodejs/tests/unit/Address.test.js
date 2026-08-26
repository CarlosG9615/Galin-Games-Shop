import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import Address from '../../src/models/Address.js';

function baseAddress(overrides = {}) {
  return new Address({
    userId: new mongoose.Types.ObjectId(),
    tipo: 'envio',
    titulo: 'Casa',
    calle: 'Calle Falsa',
    numero: '123',
    ciudad: 'Madrid',
    provincia: 'Madrid',
    codigoPostal: '28080',
    pais: 'España',
    ...overrides,
  });
}

describe('src/models/Address.js', () => {
  it('valida correctamente con todos los campos obligatorios', async () => {
    const address = baseAddress();
    await expect(address.validate()).resolves.toBeUndefined();
  });

  it('falla la validación si falta userId', async () => {
    const address = baseAddress({ userId: undefined });
    await expect(address.validate()).rejects.toMatchObject({
      errors: { userId: expect.anything() },
    });
  });

  it('falla la validación si tipo no es "envio" ni "facturacion"', async () => {
    const address = baseAddress({ tipo: 'otro' });
    await expect(address.validate()).rejects.toMatchObject({
      errors: { tipo: expect.anything() },
    });
  });

  it('falla la validación si falta un campo obligatorio de la dirección', async () => {
    const address = baseAddress({ calle: undefined });
    await expect(address.validate()).rejects.toMatchObject({
      errors: { calle: expect.anything() },
    });
  });

  it('pisoPuerta es opcional', async () => {
    const address = baseAddress();
    await expect(address.validate()).resolves.toBeUndefined();
    expect(address.pisoPuerta).toBeNull();
  });

  it('esPredeterminada es false por defecto', () => {
    const address = baseAddress();
    expect(address.esPredeterminada).toBe(false);
  });

  it('tiene un índice compuesto sobre userId y tipo', () => {
    const indexes = Address.schema.indexes();
    const compuesto = indexes.find(([def]) => def.userId === 1 && def.tipo === 1);
    expect(compuesto).toBeDefined();
  });
});
