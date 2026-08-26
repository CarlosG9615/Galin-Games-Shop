import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { httpClient } from './httpClient'

function mockFetchOnce({ ok, status, json }) {
  if (!globalThis.fetch || !globalThis.fetch.mock) {
    globalThis.fetch = vi.fn()
  }
  globalThis.fetch.mockResolvedValueOnce({
    ok,
    status,
    json: vi.fn().mockResolvedValueOnce(json),
  })
}

describe('httpClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    delete globalThis.fetch
  })

  it('get() hace fetch con credentials:include y sin body', async () => {
    mockFetchOnce({ ok: true, status: 200, json: { foo: 'bar' } })

    const result = await httpClient.get('/api/users/me')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/users/me',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    )
    expect(result).toEqual({ ok: true, data: { foo: 'bar' } })
  })

  it('post() serializa el body en JSON con Content-Type', async () => {
    mockFetchOnce({ ok: true, status: 201, json: { id: 1 } })

    await httpClient.post('/api/addresses', { titulo: 'Casa' })

    const [, options] = globalThis.fetch.mock.calls[0]
    expect(options.method).toBe('POST')
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(options.body)).toEqual({ titulo: 'Casa' })
  })

  it('put()/patch()/del() usan el verbo HTTP correcto', async () => {
    mockFetchOnce({ ok: true, status: 200, json: {} })
    await httpClient.put('/api/addresses/1', { titulo: 'X' })
    expect(globalThis.fetch.mock.calls[0][1].method).toBe('PUT')

    mockFetchOnce({ ok: true, status: 200, json: {} })
    await httpClient.patch('/api/addresses/1/predeterminada')
    expect(globalThis.fetch.mock.calls[1][1].method).toBe('PATCH')

    mockFetchOnce({ ok: true, status: 200, json: {} })
    await httpClient.del('/api/users/me', { password: 'x' })
    expect(globalThis.fetch.mock.calls[2][1].method).toBe('DELETE')
  })

  it('devuelve ok:false con status/message/errors cuando la respuesta no es ok', async () => {
    mockFetchOnce({ ok: false, status: 409, json: { message: 'Ya existe', errors: [{ field: 'username' }] } })

    const result = await httpClient.post('/api/users/me', { username: 'x' })

    expect(result).toEqual({
      ok: false,
      status: 409,
      message: 'Ya existe',
      errors: [{ field: 'username' }],
      blockedUntil: undefined,
    })
  })

  it('propaga blockedUntil en respuestas 423', async () => {
    const blockedUntil = '2026-08-27T10:00:00.000Z'
    mockFetchOnce({ ok: false, status: 423, json: { message: 'Bloqueado', blockedUntil } })

    const result = await httpClient.post('/api/users/me/verify-password', { password: 'x', action: 'emailChange' })

    expect(result.status).toBe(423)
    expect(result.blockedUntil).toBe(blockedUntil)
  })

  it('devuelve reason:"network" (sin message hardcodeado) cuando fetch rechaza', async () => {
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('fallo de red'))

    const result = await httpClient.get('/api/users/me')

    expect(result).toEqual({ ok: false, status: 0, reason: 'network' })
  })

  it('devuelve reason:"timeout" cuando la petición se aborta', async () => {
    const abortError = new Error('aborted')
    abortError.name = 'AbortError'
    globalThis.fetch = vi.fn().mockRejectedValueOnce(abortError)

    const result = await httpClient.get('/api/users/me')

    expect(result).toEqual({ ok: false, status: 0, reason: 'timeout' })
  })

  it('postForm() envía el FormData sin Content-Type manual', async () => {
    mockFetchOnce({ ok: true, status: 200, json: { avatarUrl: 'https://x/a.jpg' } })
    const formData = new FormData()
    formData.append('avatar', new Blob(['x']), 'foto.jpg')

    const result = await httpClient.postForm('/api/users/me/avatar', formData)

    const [, options] = globalThis.fetch.mock.calls[0]
    expect(options.method).toBe('POST')
    expect(options.headers).toBeUndefined()
    expect(options.body).toBe(formData)
    expect(result).toEqual({ ok: true, data: { avatarUrl: 'https://x/a.jpg' } })
  })
})
