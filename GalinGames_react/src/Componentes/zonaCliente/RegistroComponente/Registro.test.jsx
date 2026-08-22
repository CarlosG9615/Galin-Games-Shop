import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Registro from './Registro'
import { ThemeProvider } from '../../../globalState/themeContext'
import { authService } from '../../../servicios/authService'

vi.mock('../../../servicios/authService', () => ({
  authService: {
    register: vi.fn(),
  },
}))

function renderRegistro() {
  return render(
    <MemoryRouter initialEntries={['/registro']}>
      <ThemeProvider>
        <Routes>
          <Route path="/registro" element={<Registro />} />
          <Route path="/login" element={<div>LOGIN_PAGE</div>} />
        </Routes>
      </ThemeProvider>
    </MemoryRouter>
  )
}

async function rellenarFormulario(user, overrides = {}) {
  const datos = {
    username: 'carlos', nombre: 'Carlos', apellidos: 'Galindo',
    email: 'carlos@example.com', password: 'secreto123', repetirPassword: 'secreto123',
    ...overrides,
  }
  for (const [name, valor] of Object.entries(datos)) {
    const label = { username: /nombre de usuario/i, nombre: /^nombre$/i, apellidos: /apellidos/i, email: /email/i, password: /^contraseña$/i, repetirPassword: /repetir contraseña/i }[name]
    await user.type(screen.getByLabelText(label), valor)
  }
  await user.click(screen.getByLabelText(/términos y condiciones/i))
}

describe('Registro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra error si password !== repetirPassword', async () => {
    const user = userEvent.setup()
    renderRegistro()

    await rellenarFormulario(user, { repetirPassword: 'otraCosa123' })
    await user.click(screen.getByRole('button', { name: /registrarse/i }))

    expect(await screen.findByText(/no coinciden/i)).toBeInTheDocument()
    expect(authService.register).not.toHaveBeenCalled()
  })

  it('se deshabilita el botón durante la carga', async () => {
    let resolveRegister
    authService.register.mockReturnValue(new Promise((resolve) => { resolveRegister = resolve }))

    const user = userEvent.setup()
    renderRegistro()

    await rellenarFormulario(user)
    await user.click(screen.getByRole('button', { name: /registrarse/i }))

    expect(screen.getByRole('button', { name: /enviando/i })).toBeDisabled()

    resolveRegister({ ok: true, data: { message: 'ok', userId: '1' } })
  })

  it('redirige a /login tras recibir HTTP 201', async () => {
    authService.register.mockResolvedValue({ ok: true, data: { message: 'Usuario creado correctamente', userId: '1' } })

    const user = userEvent.setup()
    renderRegistro()

    await rellenarFormulario(user)
    await user.click(screen.getByRole('button', { name: /registrarse/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/correo de verificación/i)

    await waitFor(() => expect(screen.getByText('LOGIN_PAGE')).toBeInTheDocument(), { timeout: 4000 })
  }, 6000)

  it('muestra mensaje específico tras HTTP 409', async () => {
    authService.register.mockResolvedValue({ ok: false, status: 409, message: 'El nombre de usuario ya está en uso' })

    const user = userEvent.setup()
    renderRegistro()

    await rellenarFormulario(user)
    await user.click(screen.getByRole('button', { name: /registrarse/i }))

    expect(await screen.findByText(/ya está en uso/i)).toBeInTheDocument()
  })
})
