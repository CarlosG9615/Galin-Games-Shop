import { describe, it, expect, vi } from 'vitest'
import { gameService } from './gameService'
import { httpClient } from './httpClient'

vi.mock('./httpClient', () => ({
  httpClient: {
    get: vi.fn().mockResolvedValue({ ok: true, data: {} }),
    post: vi.fn().mockResolvedValue({ ok: true, data: {} }),
    put: vi.fn().mockResolvedValue({ ok: true, data: {} }),
    patch: vi.fn().mockResolvedValue({ ok: true, data: {} }),
    del: vi.fn().mockResolvedValue({ ok: true, data: {} }),
    postForm: vi.fn().mockResolvedValue({ ok: true, data: {} }),
  },
}))

describe('gameService', () => {
  it('getJuegosDestacados() llama a GET /api/games/destacados', async () => {
    await gameService.getJuegosDestacados()
    expect(httpClient.get).toHaveBeenCalledWith('/api/games/destacados')
  })

  it('getJuegosPorPlataforma() llama a GET /api/games/plataforma/:plataforma', async () => {
    await gameService.getJuegosPorPlataforma('pc')
    expect(httpClient.get).toHaveBeenCalledWith('/api/games/plataforma/pc')
  })

  it('getJuegoPorId() llama a GET /api/games/:id', async () => {
    await gameService.getJuegoPorId('abc123')
    expect(httpClient.get).toHaveBeenCalledWith('/api/games/abc123')
  })

  it('suscribirNotificacion() llama a POST /api/games/:id/notificarme con la plataforma', async () => {
    await gameService.suscribirNotificacion('abc123', 'PC')
    expect(httpClient.post).toHaveBeenCalledWith('/api/games/abc123/notificarme', { plataforma: 'PC' })
  })
})
