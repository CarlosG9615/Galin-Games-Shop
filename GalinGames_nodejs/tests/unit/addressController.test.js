import { describe, it, expect, vi } from 'vitest';
import { createAddressController } from '../../src/controllers/addressController.js';

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function buildAddressDoc(overrides = {}) {
  return {
    _id: 'address-1',
    userId: 'user-1',
    tipo: 'envio',
    titulo: 'Casa',
    calle: 'Calle Falsa',
    numero: '123',
    pisoPuerta: null,
    ciudad: 'Madrid',
    provincia: 'Madrid',
    codigoPostal: '28080',
    pais: 'España',
    esPredeterminada: false,
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function buildController(overrides = {}) {
  const Address = {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    countDocuments: vi.fn(),
    updateMany: vi.fn().mockResolvedValue(undefined),
    deleteOne: vi.fn().mockResolvedValue(undefined),
    ...overrides.Address,
  };

  const controller = createAddressController({ Address });

  return { controller, Address };
}

const validBody = {
  tipo: 'envio',
  titulo: 'Casa',
  calle: 'Calle Falsa',
  numero: '123',
  pisoPuerta: '2ºB',
  ciudad: 'Madrid',
  provincia: 'Madrid',
  codigoPostal: '28080',
  pais: 'España',
};

describe('addressController.listAddresses', () => {
  it('separa las direcciones en envio y facturacion, predeterminada primero', async () => {
    const { controller, Address } = buildController();
    const envioDefault = buildAddressDoc({ _id: 'a1', tipo: 'envio', esPredeterminada: true });
    const envioOtra = buildAddressDoc({ _id: 'a2', tipo: 'envio', esPredeterminada: false });
    const facturacion = buildAddressDoc({ _id: 'a3', tipo: 'facturacion', esPredeterminada: false });
    Address.find.mockReturnValueOnce({ sort: vi.fn().mockResolvedValueOnce([envioDefault, envioOtra, facturacion]) });

    const req = { user: { userId: 'user-1' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.listAddresses(req, res, next);

    expect(Address.find).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      envio: [envioDefault, envioOtra],
      facturacion: [facturacion],
    });
  });

  it('devuelve arrays vacíos si el usuario no tiene direcciones', async () => {
    const { controller, Address } = buildController();
    Address.find.mockReturnValueOnce({ sort: vi.fn().mockResolvedValueOnce([]) });

    const req = { user: { userId: 'user-1' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.listAddresses(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ envio: [], facturacion: [] });
  });
});

describe('addressController.createAddress', () => {
  it('crea la dirección y devuelve 201 con offerReuseForOtherType:true si no hay ninguna del otro tipo', async () => {
    const { controller, Address } = buildController();
    // Orden real de las dos consultas en el controlador: otherTypeCount (tipo
    // contrario) primero, sameTypeCount (mismo tipo, para esPredeterminada) después.
    Address.countDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    const created = buildAddressDoc();
    Address.create.mockResolvedValueOnce(created);

    const req = { user: { userId: 'user-1' }, body: { ...validBody } };
    const res = mockRes();
    const next = vi.fn();

    await controller.createAddress(req, res, next);

    expect(Address.countDocuments).toHaveBeenNthCalledWith(1, { userId: 'user-1', tipo: 'facturacion' });
    expect(Address.countDocuments).toHaveBeenNthCalledWith(2, { userId: 'user-1', tipo: 'envio' });
    expect(Address.create).toHaveBeenCalledWith(expect.objectContaining({ ...validBody, userId: 'user-1' }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ address: created, offerReuseForOtherType: true });
  });

  it('devuelve offerReuseForOtherType:false si ya existe una dirección del otro tipo', async () => {
    const { controller, Address } = buildController();
    Address.countDocuments.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    Address.create.mockResolvedValueOnce(buildAddressDoc());

    const req = { user: { userId: 'user-1' }, body: { ...validBody, tipo: 'facturacion' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.createAddress(req, res, next);

    expect(Address.countDocuments).toHaveBeenNthCalledWith(1, { userId: 'user-1', tipo: 'envio' });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ offerReuseForOtherType: false }));
  });

  it('marca esPredeterminada:true si es la primera dirección de ese tipo (petición de usuario)', async () => {
    const { controller, Address } = buildController();
    Address.countDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    Address.create.mockResolvedValueOnce(buildAddressDoc());

    const req = { user: { userId: 'user-1' }, body: { ...validBody } };
    const res = mockRes();
    const next = vi.fn();

    await controller.createAddress(req, res, next);

    expect(Address.countDocuments).toHaveBeenNthCalledWith(2, { userId: 'user-1', tipo: 'envio' });
    expect(Address.create).toHaveBeenCalledWith(expect.objectContaining({ esPredeterminada: true }));
  });

  it('marca esPredeterminada:false si ya hay otra dirección del mismo tipo', async () => {
    const { controller, Address } = buildController();
    Address.countDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(2);
    Address.create.mockResolvedValueOnce(buildAddressDoc());

    const req = { user: { userId: 'user-1' }, body: { ...validBody } };
    const res = mockRes();
    const next = vi.fn();

    await controller.createAddress(req, res, next);

    expect(Address.create).toHaveBeenCalledWith(expect.objectContaining({ esPredeterminada: false }));
  });
});

describe('addressController.updateAddress', () => {
  it('llama a next con AppError 404 si la dirección no existe o no es del usuario', async () => {
    const { controller, Address } = buildController();
    Address.findOne.mockResolvedValueOnce(null);

    const req = { user: { userId: 'user-1' }, params: { id: 'no-existe' }, body: { ...validBody } };
    const res = mockRes();
    const next = vi.fn();

    await controller.updateAddress(req, res, next);

    expect(Address.findOne).toHaveBeenCalledWith({ _id: 'no-existe', userId: 'user-1' });
    expect(next.mock.calls[0][0].status).toBe(404);
  });

  it('actualiza todos los campos y guarda', async () => {
    const { controller, Address } = buildController();
    const address = buildAddressDoc();
    Address.findOne.mockResolvedValueOnce(address);

    const req = {
      user: { userId: 'user-1' },
      params: { id: 'address-1' },
      body: { ...validBody, titulo: 'Trabajo', ciudad: 'Barcelona' },
    };
    const res = mockRes();
    const next = vi.fn();

    await controller.updateAddress(req, res, next);

    expect(address.titulo).toBe('Trabajo');
    expect(address.ciudad).toBe('Barcelona');
    expect(address.save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ address });
  });
});

describe('addressController.setDefaultAddress', () => {
  it('llama a next con AppError 404 si la dirección no existe o no es del usuario', async () => {
    const { controller, Address } = buildController();
    Address.findOne.mockResolvedValueOnce(null);

    const req = { user: { userId: 'user-1' }, params: { id: 'no-existe' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.setDefaultAddress(req, res, next);

    expect(next.mock.calls[0][0].status).toBe(404);
  });

  it('desmarca las demás direcciones del mismo tipo y marca la nueva como predeterminada', async () => {
    const { controller, Address } = buildController();
    const address = buildAddressDoc({ tipo: 'facturacion', esPredeterminada: false });
    Address.findOne.mockResolvedValueOnce(address);

    const req = { user: { userId: 'user-1' }, params: { id: 'address-1' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.setDefaultAddress(req, res, next);

    expect(Address.updateMany).toHaveBeenCalledWith(
      { userId: 'user-1', tipo: 'facturacion', esPredeterminada: true },
      { esPredeterminada: false },
    );
    expect(address.esPredeterminada).toBe(true);
    expect(address.save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ address });
  });
});

describe('addressController.deleteAddress', () => {
  it('llama a next con AppError 404 si la dirección no existe o no es del usuario', async () => {
    const { controller, Address } = buildController();
    Address.findOne.mockResolvedValueOnce(null);

    const req = { user: { userId: 'user-1' }, params: { id: 'no-existe' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.deleteAddress(req, res, next);

    expect(next.mock.calls[0][0].status).toBe(404);
    expect(Address.deleteOne).not.toHaveBeenCalled();
  });

  it('borra la dirección propia y devuelve 200', async () => {
    const { controller, Address } = buildController();
    const address = buildAddressDoc();
    Address.findOne.mockResolvedValueOnce(address);

    const req = { user: { userId: 'user-1' }, params: { id: 'address-1' } };
    const res = mockRes();
    const next = vi.fn();

    await controller.deleteAddress(req, res, next);

    expect(Address.findOne).toHaveBeenCalledWith({ _id: 'address-1', userId: 'user-1' });
    expect(Address.deleteOne).toHaveBeenCalledWith({ _id: 'address-1' });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
