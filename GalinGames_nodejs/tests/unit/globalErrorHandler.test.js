import { describe, it, expect, vi, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import globalErrorHandler from '../../src/middleware/globalErrorHandler.js';
import { AppError as AppErrorClass } from '../../src/utils/nullGuard.js';

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockReq() {
  return { method: 'POST', originalUrl: '/api/auth/login' };
}

describe('src/middleware/globalErrorHandler.js', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('responde con el status de un AppError y su mensaje', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = mockRes();
    const err = new AppErrorClass('Campo requerido ausente: username', 400);

    globalErrorHandler(err, mockReq(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ code: 400, message: 'Campo requerido ausente: username' });
  });

  it('convierte un error de Mongoose código 11000 en username a HTTP 409', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = mockRes();
    const err = Object.assign(new Error('duplicate'), { code: 11000, keyPattern: { username: 1 } });

    globalErrorHandler(err, mockReq(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ code: 409, message: 'El nombre de usuario ya está en uso' });
  });

  it('convierte un error de Mongoose código 11000 en email a HTTP 409', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = mockRes();
    const err = Object.assign(new Error('duplicate'), { code: 11000, keyPattern: { email: 1 } });

    globalErrorHandler(err, mockReq(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ code: 409, message: 'El email ya está en uso' });
  });

  it('convierte un JsonWebTokenError en HTTP 401', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = mockRes();
    const err = new jwt.JsonWebTokenError('invalid signature');

    globalErrorHandler(err, mockReq(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ code: 401, message: 'Token inválido' });
  });

  it('convierte un TokenExpiredError en HTTP 401 con mensaje de expiración', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = mockRes();
    const err = new jwt.TokenExpiredError('jwt expired', new Date());

    globalErrorHandler(err, mockReq(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ code: 401, message: 'El token ha expirado' });
  });

  it('convierte un Error genérico en HTTP 500 con mensaje genérico, sin exponer err.message ni datos internos', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = mockRes();
    const err = new Error('connection refused at mongodb://user:pass@host');

    globalErrorHandler(err, mockReq(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body).toEqual({ code: 500, message: 'Error interno del servidor' });
    expect(JSON.stringify(body)).not.toContain('mongodb://');
    expect(JSON.stringify(body)).not.toContain('pass');
  });

  it('ninguna respuesta contiene el string "undefined" como valor de campo', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = mockRes();
    const err = new Error('boom');

    globalErrorHandler(err, mockReq(), res, vi.fn());

    const body = res.json.mock.calls[0][0];
    expect(Object.values(body).some((v) => v === undefined)).toBe(false);
  });
});
