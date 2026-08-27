import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormularioDireccion from './FormularioDireccion'

describe('FormularioDireccion', () => {
  it('muestra el título de creación según el tipo', () => {
    render(<FormularioDireccion tipo="envio" direccion={null} onCancel={vi.fn()} onSave={vi.fn()} />)
    expect(screen.getByText(/nueva dirección de envío/i)).toBeInTheDocument()
  })

  it('muestra el título de edición y precarga los valores cuando se edita', () => {
    const direccion = {
      titulo: 'Casa', calle: 'Calle Falsa', numero: '123', pisoPuerta: '', ciudad: 'Madrid', provincia: 'Madrid', codigoPostal: '28080', pais: 'España',
    }
    render(<FormularioDireccion tipo="envio" direccion={direccion} onCancel={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByText(/editar dirección/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Casa')).toBeInTheDocument()
  })

  it('el botón de guardar está deshabilitado mientras falte un campo obligatorio', () => {
    render(<FormularioDireccion tipo="envio" direccion={null} onCancel={vi.fn()} onSave={vi.fn()} />)
    expect(screen.getByRole('button', { name: /crear/i })).toBeDisabled()
  })

  it('llama a onSave con los valores introducidos (pisoPuerta opcional puede quedar vacío)', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<FormularioDireccion tipo="envio" direccion={null} onCancel={vi.fn()} onSave={onSave} />)

    await user.type(screen.getByLabelText('Título'), 'Casa')
    await user.type(screen.getByLabelText('Calle'), 'Calle Falsa')
    await user.type(screen.getByLabelText('Número'), '123')

    // País → Provincia → Ciudad en cascada: Provincia empieza deshabilitada hasta
    // elegir país, Ciudad hasta elegir provincia (Requisito de la cascada).
    await user.click(screen.getByRole('combobox', { name: 'País' }))
    await user.click(screen.getByRole('option', { name: 'España' }))

    await user.click(screen.getByRole('combobox', { name: 'Provincia' }))
    await user.click(screen.getByRole('option', { name: 'Madrid' }))

    await user.type(screen.getByLabelText('Ciudad'), 'Madrid')
    await user.type(screen.getByLabelText('Código postal'), '28080')

    const boton = screen.getByRole('button', { name: /crear/i })
    expect(boton).not.toBeDisabled()
    await user.click(boton)

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: 'Casa', calle: 'Calle Falsa', numero: '123', pisoPuerta: '', ciudad: 'Madrid', provincia: 'Madrid', codigoPostal: '28080', pais: 'España' }),
    )
  })

  it('Provincia y Ciudad empiezan deshabilitadas hasta elegir el campo anterior', async () => {
    render(<FormularioDireccion tipo="envio" direccion={null} onCancel={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByRole('combobox', { name: 'Provincia' })).toBeDisabled()
    expect(screen.getByLabelText('Ciudad')).toBeDisabled()
  })

  it('cambiar de país resetea la provincia y la ciudad ya elegidas', async () => {
    const user = userEvent.setup()
    render(<FormularioDireccion tipo="envio" direccion={null} onCancel={vi.fn()} onSave={vi.fn()} />)

    await user.click(screen.getByRole('combobox', { name: 'País' }))
    await user.click(screen.getByRole('option', { name: 'España' }))
    await user.click(screen.getByRole('combobox', { name: 'Provincia' }))
    await user.click(screen.getByRole('option', { name: 'Madrid' }))
    await user.type(screen.getByLabelText('Ciudad'), 'Madrid')

    await user.click(screen.getByRole('combobox', { name: 'País' }))
    await user.click(screen.getByRole('option', { name: 'México' }))

    expect(screen.getByRole('combobox', { name: 'Provincia' })).toHaveTextContent(/selecciona una provincia/i)
    expect(screen.getByLabelText('Ciudad')).toHaveValue('')
    expect(screen.getByLabelText('Ciudad')).toBeDisabled()
  })

  it('llama a onCancel al pulsar "Cancelar"', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(<FormularioDireccion tipo="envio" direccion={null} onCancel={onCancel} onSave={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('muestra el mensaje de error recibido por props', () => {
    render(<FormularioDireccion tipo="envio" direccion={null} onCancel={vi.fn()} onSave={vi.fn()} error="No se pudo guardar la dirección. Inténtalo de nuevo." />)
    expect(screen.getByRole('alert')).toHaveTextContent(/no se pudo guardar/i)
  })
})
