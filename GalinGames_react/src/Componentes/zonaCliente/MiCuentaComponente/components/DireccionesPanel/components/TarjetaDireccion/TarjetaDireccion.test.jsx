import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TarjetaDireccion from './TarjetaDireccion'

const direccion = {
  _id: 'addr-1',
  tipo: 'envio',
  titulo: 'Casa',
  calle: 'Calle Falsa',
  numero: '123',
  pisoPuerta: '2ºB',
  ciudad: 'Madrid',
  provincia: 'Madrid',
  codigoPostal: '28080',
  pais: 'España',
  esPredeterminada: false,
}

function renderTarjeta(props = {}) {
  return render(
    <TarjetaDireccion direccion={direccion} onSetDefault={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} {...props} />,
  )
}

describe('TarjetaDireccion', () => {
  it('muestra el título y la dirección completa', () => {
    renderTarjeta()

    expect(screen.getByText('Casa')).toBeInTheDocument()
    expect(screen.getByText(/calle falsa 123, 2ºb/i)).toBeInTheDocument()
  })

  it('no muestra el badge de predeterminada cuando no lo es', () => {
    renderTarjeta()
    expect(screen.queryByText(/predeterminada/i)).not.toBeInTheDocument()
  })

  it('muestra el badge y deshabilita el icono cuando ya es predeterminada', () => {
    renderTarjeta({ direccion: { ...direccion, esPredeterminada: true } })

    expect(screen.getByText(/predeterminada/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/marcar como predeterminada/i)).toBeDisabled()
  })

  it('el icono de casa lleva la clase de color de predeterminada solo cuando lo es', () => {
    const { container, rerender } = renderTarjeta({ direccion: { ...direccion, esPredeterminada: false } })
    expect(container.querySelector('.tarjeta-direccion__casa--predeterminada')).not.toBeInTheDocument()

    rerender(
      <TarjetaDireccion
        direccion={{ ...direccion, esPredeterminada: true }}
        onSetDefault={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(container.querySelector('.tarjeta-direccion__casa--predeterminada')).toBeInTheDocument()
  })

  it('muestra el icono de casa para envío y el de tarjeta para facturación', () => {
    const { container: contEnvio } = renderTarjeta({ direccion: { ...direccion, tipo: 'envio' } })
    expect(contEnvio.querySelector('.tarjeta-direccion__casa rect')).not.toBeInTheDocument()

    const { container: contFact } = renderTarjeta({ direccion: { ...direccion, tipo: 'facturacion' } })
    expect(contFact.querySelector('.tarjeta-direccion__casa rect')).toBeInTheDocument()
  })

  it('llama a onSetDefault al pulsar el icono de predeterminada', async () => {
    const onSetDefault = vi.fn()
    const user = userEvent.setup()
    renderTarjeta({ onSetDefault })

    await user.click(screen.getByLabelText(/marcar como predeterminada/i))

    expect(onSetDefault).toHaveBeenCalledWith(direccion)
  })

  it('llama a onEdit al pulsar el icono de lápiz', async () => {
    const onEdit = vi.fn()
    const user = userEvent.setup()
    renderTarjeta({ onEdit })

    await user.click(screen.getByLabelText(/modificar dirección/i))

    expect(onEdit).toHaveBeenCalledWith(direccion)
  })

  it('pide confirmación y llama a onDelete al pulsar el icono de papelera si se acepta', async () => {
    const onDelete = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderTarjeta({ onDelete })

    await user.click(screen.getByLabelText(/eliminar dirección/i))

    expect(window.confirm).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith(direccion)
  })

  it('si se cancela la confirmación, no llama a onDelete', async () => {
    const onDelete = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderTarjeta({ onDelete })

    await user.click(screen.getByLabelText(/eliminar dirección/i))

    expect(onDelete).not.toHaveBeenCalled()
  })
})
