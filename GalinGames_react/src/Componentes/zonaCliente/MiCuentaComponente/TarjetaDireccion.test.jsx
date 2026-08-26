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

describe('TarjetaDireccion', () => {
  it('muestra el título y la dirección completa', () => {
    render(<TarjetaDireccion direccion={direccion} onSetDefault={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText('Casa')).toBeInTheDocument()
    expect(screen.getByText(/calle falsa 123, 2ºb/i)).toBeInTheDocument()
  })

  it('no muestra el badge de predeterminada cuando no lo es', () => {
    render(<TarjetaDireccion direccion={direccion} onSetDefault={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.queryByText(/predeterminada/i)).not.toBeInTheDocument()
  })

  it('muestra el badge y deshabilita el icono cuando ya es predeterminada', () => {
    render(<TarjetaDireccion direccion={{ ...direccion, esPredeterminada: true }} onSetDefault={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText(/predeterminada/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/marcar como predeterminada/i)).toBeDisabled()
  })

  it('llama a onSetDefault al pulsar el icono de predeterminada', async () => {
    const onSetDefault = vi.fn()
    const user = userEvent.setup()
    render(<TarjetaDireccion direccion={direccion} onSetDefault={onSetDefault} onEdit={vi.fn()} />)

    await user.click(screen.getByLabelText(/marcar como predeterminada/i))

    expect(onSetDefault).toHaveBeenCalledWith(direccion)
  })

  it('llama a onEdit al pulsar el icono de lápiz', async () => {
    const onEdit = vi.fn()
    const user = userEvent.setup()
    render(<TarjetaDireccion direccion={direccion} onSetDefault={vi.fn()} onEdit={onEdit} />)

    await user.click(screen.getByLabelText(/modificar dirección/i))

    expect(onEdit).toHaveBeenCalledWith(direccion)
  })
})
