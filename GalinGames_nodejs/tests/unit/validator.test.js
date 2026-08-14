import { describe, it, expect, vi } from 'vitest';
import { validateLoginInput, validateRegisterInput } from '../../src/middleware/validator.js';

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
