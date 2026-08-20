import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Login from './Login'
import { AuthProvider } from '../../../globalState/authContext'
import { authService } from '../../../servicios/authService'

vi.mock('../../../servicios/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    silentRefresh: vi.fn(),
  },
}))

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>HOME</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Login', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renderiza los campos username y password', () => {
    renderLogin()

    expect(screen.getByLabelText(/nombre de usuario/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('muestra error de validación si se envía con campos de solo espacios y no hace fetch', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/nombre de usuario/i), '   ')
    await user.type(screen.getByLabelText(/contraseña/i), '   ')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(authService.login).not.toHaveBeenCalled()
  })

  it('el botón se deshabilita durante loading', async () => {
    let resolveLogin
    authService.login.mockReturnValue(new Promise((resolve) => { resolveLogin = resolve }))

    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/nombre de usuario/i), 'carlos')
    await user.type(screen.getByLabelText(/contraseña/i), 'secreto123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled()

    resolveLogin({ ok: true, data: { userId: '1', username: 'carlos' } })
  })

  it('muestra contador de segundos al recibir respuesta 429', async () => {
    authService.login.mockResolvedValue({ ok: false, status: 429, retryAfter: 30 })

    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/nombre de usuario/i), 'carlos')
    await user.type(screen.getByLabelText(/contraseña/i), 'secreto123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText(/30 segundos/)).toBeInTheDocument()
  })

  it('navega a / al recibir respuesta 200', async () => {
    authService.login.mockResolvedValue({ ok: true, data: { userId: '1', username: 'carlos' } })

    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/nombre de usuario/i), 'carlos')
    await user.type(screen.getByLabelText(/contraseña/i), 'secreto123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => expect(screen.getByText('HOME')).toBeInTheDocument())
  })
})
