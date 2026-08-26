import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DireccionesPanel from './DireccionesPanel'
import { addressService } from '../../../servicios/addressService'

vi.mock('../../../servicios/addressService', () => ({
  addressService: {
    listAddresses: vi.fn(),
    createAddress: vi.fn(),
    updateAddress: vi.fn(),
    setDefaultAddress: vi.fn(),
  },
}))

const direccionEnvio = {
  _id: 'addr-1',
  tipo: 'envio',
  titulo: 'Casa',
  calle: 'Calle Falsa',
  numero: '123',
  pisoPuerta: '',
  ciudad: 'Madrid',
  provincia: 'Madrid',
  codigoPostal: '28080',
  pais: 'España',
  esPredeterminada: true,
}

// user.type() no admite escritura concurrente (Promise.all interfiere entre llamadas
// y mezcla las pulsaciones de distintos campos) — deben escribirse una a una.
async function llenarFormulario(user) {
  await user.type(screen.getByLabelText('Título'), 'Trabajo')
  await user.type(screen.getByLabelText('Calle'), 'Calle Nueva')
  await user.type(screen.getByLabelText('Número'), '5')
  await user.type(screen.getByLabelText('Ciudad'), 'Barcelona')
  await user.type(screen.getByLabelText('Provincia'), 'Barcelona')
  await user.type(screen.getByLabelText('Código postal'), '08001')
  await user.type(screen.getByLabelText('País'), 'España')
}

describe('DireccionesPanel', () => {
  beforeEach(() => {
    // mockReset (no solo clearAllMocks): clearAllMocks NO vacía la cola de
    // mockResolvedValueOnce ya encolados — una respuesta sobrante de un test
    // anterior se colaría como la primera respuesta del siguiente.
    addressService.listAddresses.mockReset()
    addressService.createAddress.mockReset()
    addressService.updateAddress.mockReset()
    addressService.setDefaultAddress.mockReset()
  })

  it('muestra solo "+ Nueva dirección" cuando no hay ninguna registrada de ese tipo', async () => {
    addressService.listAddresses.mockResolvedValueOnce({ ok: true, data: { envio: [], facturacion: [] } })
    render(<DireccionesPanel />)

    expect(await screen.findAllByRole('button', { name: /nueva dirección/i })).toHaveLength(2)
  })

  it('lista las direcciones existentes bajo el bloque de su tipo', async () => {
    addressService.listAddresses.mockResolvedValueOnce({ ok: true, data: { envio: [direccionEnvio], facturacion: [] } })
    render(<DireccionesPanel />)

    expect(await screen.findByText('Casa')).toBeInTheDocument()
    expect(screen.getByText(/dirección de envío/i)).toBeInTheDocument()
  })

  it('muestra un mensaje de error si falla la carga', async () => {
    addressService.listAddresses.mockResolvedValueOnce({ ok: false, status: 500 })
    render(<DireccionesPanel />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudieron cargar/i)
  })

  it('al marcar una dirección como predeterminada, llama al servicio y recarga el listado', async () => {
    addressService.listAddresses
      .mockResolvedValueOnce({ ok: true, data: { envio: [direccionEnvio, { ...direccionEnvio, _id: 'addr-2', titulo: 'Otra', esPredeterminada: false }], facturacion: [] } })
      .mockResolvedValueOnce({ ok: true, data: { envio: [direccionEnvio], facturacion: [] } })
    addressService.setDefaultAddress.mockResolvedValueOnce({ ok: true, data: { address: direccionEnvio } })
    const user = userEvent.setup()
    render(<DireccionesPanel />)
    await screen.findByText('Otra')

    const botonesPredeterminada = screen.getAllByLabelText(/marcar como predeterminada/i)
    await user.click(botonesPredeterminada[1])

    await waitFor(() => expect(addressService.setDefaultAddress).toHaveBeenCalledWith('addr-2'))
    await waitFor(() => expect(addressService.listAddresses).toHaveBeenCalledTimes(2))
  })

  it('crear una dirección cuando el otro tipo ya tiene direcciones no pregunta por reutilización', async () => {
    addressService.listAddresses
      .mockResolvedValueOnce({ ok: true, data: { envio: [], facturacion: [{ ...direccionEnvio, _id: 'addr-fact', tipo: 'facturacion' }] } })
      .mockResolvedValueOnce({ ok: true, data: { envio: [{ ...direccionEnvio, _id: 'addr-nueva' }], facturacion: [{ ...direccionEnvio, _id: 'addr-fact', tipo: 'facturacion' }] } })
    addressService.createAddress.mockResolvedValueOnce({ ok: true, data: { address: direccionEnvio, offerReuseForOtherType: false } })
    const user = userEvent.setup()
    render(<DireccionesPanel />)
    await screen.findAllByRole('button', { name: /nueva dirección/i })

    const botonesNueva = screen.getAllByRole('button', { name: /nueva dirección/i })
    await user.click(botonesNueva[0])
    await llenarFormulario(user)
    await user.click(screen.getByRole('button', { name: /crear/i }))

    await waitFor(() => expect(addressService.createAddress).toHaveBeenCalledTimes(1))
    expect(screen.queryByText(/quieres usar esta misma dirección/i)).not.toBeInTheDocument()
  })

  it('crear la primera dirección de un tipo ofrece reutilizarla para el otro, y confirmar la crea también ahí', async () => {
    addressService.listAddresses
      .mockResolvedValueOnce({ ok: true, data: { envio: [], facturacion: [] } })
      .mockResolvedValueOnce({ ok: true, data: { envio: [{ ...direccionEnvio, _id: 'addr-nueva' }], facturacion: [] } })
      .mockResolvedValueOnce({
        ok: true,
        data: { envio: [{ ...direccionEnvio, _id: 'addr-nueva' }], facturacion: [{ ...direccionEnvio, _id: 'addr-fact-nueva', tipo: 'facturacion' }] },
      })
    addressService.createAddress
      .mockResolvedValueOnce({ ok: true, data: { address: direccionEnvio, offerReuseForOtherType: true } })
      .mockResolvedValueOnce({ ok: true, data: { address: { ...direccionEnvio, tipo: 'facturacion' }, offerReuseForOtherType: false } })
    const user = userEvent.setup()
    render(<DireccionesPanel />)

    const botonesNueva = await screen.findAllByRole('button', { name: /nueva dirección/i })
    await user.click(botonesNueva[0])
    await llenarFormulario(user)
    await user.click(screen.getByRole('button', { name: /crear/i }))

    expect(await screen.findByText(/quieres usar esta misma dirección/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /sí, usar también/i }))

    await waitFor(() => expect(addressService.createAddress).toHaveBeenCalledTimes(2))
    expect(addressService.createAddress.mock.calls[1][0]).toEqual(expect.objectContaining({ tipo: 'facturacion', titulo: 'Trabajo' }))
  })

  it('al editar, precarga el formulario con los datos de la dirección seleccionada', async () => {
    addressService.listAddresses.mockResolvedValueOnce({ ok: true, data: { envio: [direccionEnvio], facturacion: [] } })
    const user = userEvent.setup()
    render(<DireccionesPanel />)
    await screen.findByText('Casa')

    await user.click(screen.getByLabelText(/modificar dirección/i))

    expect(screen.getByText(/editar dirección/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Casa')).toBeInTheDocument()
  })
})
