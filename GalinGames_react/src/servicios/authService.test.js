import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authService } from './authService'

function mockFetchResponse({ ok, status, json, headers = {} }) {
  return {
    ok,
    status,
    headers: { get: (name) => headers[name] ?? null },
    json: async () => json,
  }
}

describe('authService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('login devuelve { ok: true, data } con respuesta 200', async () => {
    fetch.mockResolvedValueOnce(
      mockFetchResponse({ ok: true, status: 200, json: { userId: '1', username: 'carlos' } })
    )

    const result = await authService.login('carlos', 'secreto123')

    expect(result).toEqual({ ok: true, data: { userId: '1', username: 'carlos' } })
  })

  it('login devuelve { ok: false, status: 401 } con respuesta 401', async () => {
    fetch.mockResolvedValueOnce(
      mockFetchResponse({ ok: false, status: 401, json: { message: 'Credenciales incorrectas' } })
    )

    const result = await authService.login('carlos', 'malo')

    expect(result.ok).toBe(false)
    expect(result.status).toBe(401)
  })

  it('login devuelve { ok: false, status: 0 } cuando la petición se aborta por timeout', async () => {
    fetch.mockImplementationOnce(() => {
      const err = new Error('aborted')
      err.name = 'AbortError'
      return Promise.reject(err)
    })

    const result = await authService.login('carlos', 'secreto123')

    expect(result).toEqual({ ok: false, status: 0, message: 'La petición tardó demasiado. Inténtalo de nuevo.' })
  })

  it('silentRefresh devuelve { ok: false, status: 401 } con respuesta 401', async () => {
    fetch.mockResolvedValueOnce(
      mockFetchResponse({ ok: false, status: 401, json: { message: 'Sesión expirada' } })
    )

    const result = await authService.silentRefresh()

    expect(result).toEqual({ ok: false, status: 401 })
  })
})
