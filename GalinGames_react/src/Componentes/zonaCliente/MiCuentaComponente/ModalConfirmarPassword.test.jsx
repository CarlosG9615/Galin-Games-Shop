import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModalConfirmarPassword from './ModalConfirmarPassword'

describe('ModalConfirmarPassword', () => {
  it('no renderiza nada cuando visible es false', () => {
    const { container } = render(<ModalConfirmarPassword visible={false} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renderiza el diálogo con input de contraseña cuando visible es true', () => {
    render(<ModalConfirmarPassword visible onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument()
  })

  it('el botón X llama a onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ModalConfirmarPassword visible onClose={onClose} onSubmit={vi.fn()} />)

    await user.click(screen.getByLabelText(/cerrar/i))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('llama a onSubmit con la contraseña introducida', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<ModalConfirmarPassword visible onClose={vi.fn()} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/^contraseña$/i), 'secreta123')
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    expect(onSubmit).toHaveBeenCalledWith('secreta123')
  })

  it('muestra el mensaje de error recibido por props', () => {
    render(<ModalConfirmarPassword visible onClose={vi.fn()} onSubmit={vi.fn()} error="Contraseña incorrecta." />)
    expect(screen.getByRole('alert')).toHaveTextContent('Contraseña incorrecta.')
  })

  it('cuando hay blockedUntil, deshabilita el input y muestra el aviso de bloqueo (no el error)', () => {
    render(
      <ModalConfirmarPassword
        visible
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        error="Contraseña incorrecta."
        blockedUntil="2026-08-27T10:00:00.000Z"
      />,
    )

    expect(screen.getByLabelText(/^contraseña$/i)).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent(/24 horas/i)
    expect(screen.queryByText('Contraseña incorrecta.')).not.toBeInTheDocument()
  })

  it('el input se limpia cada vez que el modal se vuelve a abrir', () => {
    const { rerender } = render(<ModalConfirmarPassword visible onClose={vi.fn()} onSubmit={vi.fn()} />)
    const input = screen.getByLabelText(/^contraseña$/i)
    input.focus()

    rerender(<ModalConfirmarPassword visible={false} onClose={vi.fn()} onSubmit={vi.fn()} />)
    rerender(<ModalConfirmarPassword visible onClose={vi.fn()} onSubmit={vi.fn()} />)

    expect(screen.getByLabelText(/^contraseña$/i)).toHaveValue('')
  })
})
