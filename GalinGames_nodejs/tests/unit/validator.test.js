import { describe, it, expect, vi } from 'vitest';
import {
  validateLoginInput,
  validateRegisterInput,
  validateUpdateProfileInput,
  validateAddressInput,
  validateChangePasswordInput,
} from '../../src/middleware/validator.js';

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('validateLoginInput', () => {
  it('rechaza con 400 cuando username supera 50 caracteres', () => {
    const req = { body: { username: 'a'.repeat(51), password: 'secret' } };
    const res = mockRes();
    const next = vi.fn();
    validateLoginInput(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza con 400 cuando hay un campo extra', () => {
    const req = { body: { username: 'admin', password: 'secret', extra: 'x' } };
    const res = mockRes();
    const next = vi.fn();
    validateLoginInput(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.errors.some((e) => e.field === 'extra')).toBe(true);
  });

  it('rechaza con 400 cuando username contiene un carácter de control', () => {
    const req = { body: { username: 'admin\x01', password: 'secret' } };
    const res = mockRes();
    const next = vi.fn();
    validateLoginInput(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('acepta credenciales válidas y recorta el username', () => {
    const req = { body: { username: '  admin  ', password: 'secret' } };
    const res = mockRes();
    const next = vi.fn();
    validateLoginInput(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body.username).toBe('admin');
  });
});

describe('validateRegisterInput', () => {
  const validBody = {
    username: 'admin',
    nombre: 'Carlos',
    apellidos: 'Galindo',
    email: 'carlos@example.com',
    password: 'password123',
    repetirPassword: 'password123',
  };

  it('rechaza con 400 cuando password tiene 7 caracteres', () => {
    const req = { body: { ...validBody, password: 'short12', repetirPassword: 'short12' } };
    const res = mockRes();
    const next = vi.fn();
    validateRegisterInput(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rechaza con 400 cuando password !== repetirPassword', () => {
    const req = { body: { ...validBody, repetirPassword: 'otraPassword123' } };
    const res = mockRes();
    const next = vi.fn();
    validateRegisterInput(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('los mensajes de error no contienen el valor recibido', () => {
    const secretValue = 'valorSecretoUnico12345';
    const req = { body: { ...validBody, nombre: secretValue.repeat(20) } };
    const res = mockRes();
    const next = vi.fn();
    validateRegisterInput(req, res, next);
    const body = res.json.mock.calls[0][0];
    expect(JSON.stringify(body)).not.toContain(secretValue);
  });
});

describe('validateUpdateProfileInput', () => {
  it('acepta una actualización parcial con un único campo', () => {
    const req = { body: { telefono: '600123456' } };
    const res = mockRes();
    const next = vi.fn();
    validateUpdateProfileInput(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('acepta un body vacío (sin cambios)', () => {
    const req = { body: {} };
    const res = mockRes();
    const next = vi.fn();
    validateUpdateProfileInput(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('rechaza con 400 cuando username tiene menos de 3 caracteres', () => {
    const req = { body: { username: 'ab' } };
    const res = mockRes();
    const next = vi.fn();
    validateUpdateProfileInput(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rechaza con 400 cuando nombre supera 100 caracteres', () => {
    const req = { body: { nombre: 'a'.repeat(101) } };
    const res = mockRes();
    const next = vi.fn();
    validateUpdateProfileInput(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rechaza con 400 cuando hay un campo no permitido', () => {
    const req = { body: { email: 'otro@example.com' } };
    const res = mockRes();
    const next = vi.fn();
    validateUpdateProfileInput(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.errors.some((e) => e.field === 'email' && e.rule === 'not_allowed')).toBe(true);
  });
});

describe('validateAddressInput', () => {
  const validAddress = {
    tipo: 'envio',
    titulo: 'Casa',
    calle: 'Calle Falsa',
    numero: '123',
    ciudad: 'Madrid',
    provincia: 'Madrid',
    codigoPostal: '28080',
    pais: 'España',
  };

  it('acepta una dirección válida sin pisoPuerta', () => {
    const req = { body: validAddress };
    const res = mockRes();
    const next = vi.fn();
    validateAddressInput(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('acepta una dirección válida con pisoPuerta', () => {
    const req = { body: { ...validAddress, pisoPuerta: '2ºB' } };
    const res = mockRes();
    const next = vi.fn();
    validateAddressInput(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('rechaza con 400 cuando tipo no es "envio" ni "facturacion"', () => {
    const req = { body: { ...validAddress, tipo: 'otro' } };
    const res = mockRes();
    const next = vi.fn();
    validateAddressInput(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rechaza con 400 cuando falta un campo obligatorio', () => {
    const { titulo, ...sinTitulo } = validAddress;
    const req = { body: sinTitulo };
    const res = mockRes();
    const next = vi.fn();
    validateAddressInput(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.errors.some((e) => e.field === 'titulo' && e.rule === 'required')).toBe(true);
  });
});

describe('validateChangePasswordInput', () => {
  it('acepta datos válidos con contraseñas coincidentes', () => {
    const req = { body: { currentPassword: 'actual123', newPassword: 'nuevaPassword123', repeatNewPassword: 'nuevaPassword123' } };
    const res = mockRes();
    const next = vi.fn();
    validateChangePasswordInput(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('rechaza con 400 cuando newPassword y repeatNewPassword no coinciden', () => {
    const req = { body: { currentPassword: 'actual123', newPassword: 'nuevaPassword123', repeatNewPassword: 'otraPassword123' } };
    const res = mockRes();
    const next = vi.fn();
    validateChangePasswordInput(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rechaza con 400 cuando newPassword tiene menos de 8 caracteres', () => {
    const req = { body: { currentPassword: 'actual123', newPassword: 'short12', repeatNewPassword: 'short12' } };
    const res = mockRes();
    const next = vi.fn();
    validateChangePasswordInput(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rechaza con 400 cuando falta currentPassword', () => {
    const req = { body: { newPassword: 'nuevaPassword123', repeatNewPassword: 'nuevaPassword123' } };
    const res = mockRes();
    const next = vi.fn();
    validateChangePasswordInput(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.errors.some((e) => e.field === 'currentPassword' && e.rule === 'required')).toBe(true);
  });
});
