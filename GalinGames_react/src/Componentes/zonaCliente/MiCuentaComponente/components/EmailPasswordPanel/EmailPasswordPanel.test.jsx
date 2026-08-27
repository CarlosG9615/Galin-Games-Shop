import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../../../globalState/authContext'
import { accountService } from '../../../../../servicios/accountService'
import { authService } from '../../../../../servicios/authService'
import EmailPasswordPanel from './EmailPasswordPanel'

vi.mock('../../../../../servicios/accountService', () => ({
  accountService: {
    getMe: vi.fn(),
    verifyPassword: vi.fn(),
    requestEmailChange: vi.fn(),
    changePassword: vi.fn(),
    deleteAccount: vi.fn(),
  },
}))

vi.mock('../../../../../servicios/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue({ ok: true }),
    silentRefresh: vi.fn(),
  },
}))

function renderPanel() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <EmailPasswordPanel />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('EmailPasswordPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('muestra el email cargado en modo solo lectura', async () => {
    accountService.getMe.mockResolvedValueOnce({ ok: true, data: { email: 'carlos@example.com' } })
    renderPanel()

    const emailInput = await screen.findByDisplayValue('carlos@example.com')
    expect(emailInput).toBeDisabled()
  })

  it('muestra el bloque de 2FA como "Próximamente"', async () => {
    accountService.getMe.mockResolvedValueOnce({ ok: true, data: { email: 'carlos@example.com' } })
    renderPanel()
    await screen.findByDisplayValue('carlos@example.com')

    expect(screen.getByText(/verificación en dos pasos/i)).toBeInTheDocument()
    expect(screen.getByText(/próximamente/i)).toBeInTheDocument()
  })

  it('flujo completo de modificar email: modal -> contraseña correcta -> habilita input -> validar', async () => {
    accountService.getMe.mockResolvedValueOnce({ ok: true, data: { email: 'carlos@example.com' } })
    accountService.verifyPassword.mockResolvedValueOnce({ ok: true, data: { verified: true } })
    accountService.requestEmailChange.mockResolvedValueOnce({ ok: true, data: { message: 'ok' } })
    const user = userEvent.setup()
    renderPanel()
    await screen.findByDisplayValue('carlos@example.com')

    await user.click(screen.getByRole('button', { name: /modificar email/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/^contraseña$/i), 'secreta123')
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(accountService.verifyPassword).toHaveBeenCalledWith('secreta123', 'emailChange')

    const nuevoEmailInput = screen.getByLabelText(/nuevo email/i)
    await user.type(nuevoEmailInput, 'nuevo@example.com')
    await user.click(screen.getByRole('button', { name: /validar/i }))

    await waitFor(() => expect(accountService.requestEmailChange).toHaveBeenCalledWith('secreta123', 'nuevo@example.com'))
    expect(await screen.findByRole('status')).toHaveTextContent(/correo de verificación/i)
  })

  it('el modal de modificar email muestra el aviso de bloqueo cuando la respuesta es 423', async () => {
    accountService.getMe.mockResolvedValueOnce({ ok: true, data: { email: 'carlos@example.com' } })
    accountService.verifyPassword.mockResolvedValueOnce({ ok: false, status: 423, blockedUntil: '2026-08-27T10:00:00.000Z' })
    const user = userEvent.setup()
    renderPanel()
    await screen.findByDisplayValue('carlos@example.com')

    await user.click(screen.getByRole('button', { name: /modificar email/i }))
    await user.type(screen.getByLabelText(/^contraseña$/i), 'mala')
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/24 horas/i)
  })

  it('cambio de contraseña: muestra error si la nueva y su repetición no coinciden, sin llamar al servicio', async () => {
    accountService.getMe.mockResolvedValueOnce({ ok: true, data: { email: 'carlos@example.com' } })
    const user = userEvent.setup()
    renderPanel()
    await screen.findByDisplayValue('carlos@example.com')

    await user.type(screen.getByLabelText(/contraseña actual/i), 'actual123')
    await user.type(screen.getByLabelText(/^nueva contraseña$/i), 'nuevaPassword123')
    await user.type(screen.getByLabelText(/repetir nueva contraseña/i), 'otraDistinta123')
    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/no coinciden/i)
    expect(accountService.changePassword).not.toHaveBeenCalled()
  })

  it('cambio de contraseña con éxito muestra el mensaje de confirmación', async () => {
    accountService.getMe.mockResolvedValueOnce({ ok: true, data: { email: 'carlos@example.com' } })
    accountService.changePassword.mockResolvedValueOnce({ ok: true, data: { message: 'ok' } })
    const user = userEvent.setup()
    renderPanel()
    await screen.findByDisplayValue('carlos@example.com')

    await user.type(screen.getByLabelText(/contraseña actual/i), 'actual123')
    await user.type(screen.getByLabelText(/^nueva contraseña$/i), 'nuevaPassword123')
    await user.type(screen.getByLabelText(/repetir nueva contraseña/i), 'nuevaPassword123')
    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/actualizada correctamente/i)
    expect(accountService.changePassword).toHaveBeenCalledWith('actual123', 'nuevaPassword123', 'nuevaPassword123')
  })

  it('eliminar cuenta: contraseña correcta cierra sesión y navega fuera de la vista', async () => {
    accountService.getMe.mockResolvedValueOnce({ ok: true, data: { email: 'carlos@example.com' } })
    accountService.deleteAccount.mockResolvedValueOnce({ ok: true, data: { message: 'ok' } })
    const user = userEvent.setup()
    renderPanel()
    await screen.findByDisplayValue('carlos@example.com')

    await user.click(screen.getByRole('button', { name: /eliminar cuenta/i }))
    await user.type(screen.getByLabelText(/^contraseña$/i), 'secreta123')
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    await waitFor(() => expect(accountService.deleteAccount).toHaveBeenCalledWith('secreta123'))
    await waitFor(() => expect(authService.logout).toHaveBeenCalledTimes(1))
  })
})
