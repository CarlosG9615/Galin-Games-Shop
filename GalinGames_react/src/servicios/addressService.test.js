import { describe, it, expect, vi } from 'vitest'
import { addressService } from './addressService'
import { httpClient } from './httpClient'

vi.mock('./httpClient', () => ({
  httpClient: {
    get: vi.fn().mockResolvedValue({ ok: true, data: {} }),
    post: vi.fn().mockResolvedValue({ ok: true, data: {} }),
    put: vi.fn().mockResolvedValue({ ok: true, data: {} }),
    patch: vi.fn().mockResolvedValue({ ok: true, data: {} }),
  },
}))

describe('addressService', () => {
  it('listAddresses() llama a GET /api/addresses', async () => {
    await addressService.listAddresses()
    expect(httpClient.get).toHaveBeenCalledWith('/api/addresses')
  })

  it('createAddress() llama a POST /api/addresses con los datos', async () => {
    const datos = { tipo: 'envio', titulo: 'Casa' }
    await addressService.createAddress(datos)
    expect(httpClient.post).toHaveBeenCalledWith('/api/addresses', datos)
  })

  it('updateAddress() llama a PUT /api/addresses/:id con los datos', async () => {
    const datos = { tipo: 'envio', titulo: 'Casa' }
    await addressService.updateAddress('addr-1', datos)
    expect(httpClient.put).toHaveBeenCalledWith('/api/addresses/addr-1', datos)
  })

  it('setDefaultAddress() llama a PATCH /api/addresses/:id/predeterminada', async () => {
    await addressService.setDefaultAddress('addr-1')
    expect(httpClient.patch).toHaveBeenCalledWith('/api/addresses/addr-1/predeterminada')
  })
})
