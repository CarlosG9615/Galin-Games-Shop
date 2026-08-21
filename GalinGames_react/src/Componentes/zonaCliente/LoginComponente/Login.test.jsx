import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fc from 'fast-check'
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

function renderLogin(initialEntry = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
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

  it('muestra el banner de email verificado cuando la URL incluye ?verificado=true', () => {
    renderLogin('/login?verificado=true')

    expect(screen.getByRole('status')).toHaveTextContent(/email verificado correctamente/i)
  })

  it('no muestra el banner de email verificado sin el query param', () => {
    renderLogin()

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
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

  it('Propiedad 12: para todo campo compuesto solo de espacios en blanco, el formulario nunca llama a authService.login', async () => {
    // Solo espacio y tab: jsdom convierte un valor de <input> compuesto únicamente por
    // '\n' en cadena vacía (los <input> de una sola línea no admiten saltos de línea),
    // lo que activaría el bloqueo nativo `required` en vez del validador de React que
    // esta propiedad quiere ejercitar — mismo comportamiento correcto, pero no lo que
    // se está probando aquí.
    const whitespaceArb = fc.string({ unit: fc.constantFrom(' ', '\t'), minLength: 1, maxLength: 20 })

    await fc.assert(
      fc.asyncProperty(whitespaceArb, whitespaceArb, async (usernameWhitespace, passwordWhitespace) => {
        vi.clearAllMocks()
        try {
          renderLogin()

          // fireEvent.change (no userEvent.type): userEvent interpreta '\t' y '\n' como
          // pulsaciones de teclado (Tab / Enter) en vez de como caracteres del valor, lo
          // que rompería el propósito de la propiedad (valor compuesto solo de espacios).
          fireEvent.change(screen.getByLabelText(/nombre de usuario/i), { target: { value: usernameWhitespace } })
          fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: passwordWhitespace } })
          fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

          expect(await screen.findByRole('alert')).toBeInTheDocument()
          expect(authService.login).not.toHaveBeenCalled()
        } finally {
          cleanup()
        }
      }),
      { numRuns: 25 },
    )
  })
})
