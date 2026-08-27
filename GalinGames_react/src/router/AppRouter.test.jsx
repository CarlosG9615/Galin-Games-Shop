import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../globalState/authContext'
import { ThemeProvider } from '../globalState/themeContext'
import { LanguageProvider } from '../globalState/languageContext'
import { accountService } from '../servicios/accountService'
import { addressService } from '../servicios/addressService'
import { authService } from '../servicios/authService'
import AppRouter from './AppRouter'

vi.mock('../servicios/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    silentRefresh: vi.fn(),
  },
}))

vi.mock('../servicios/accountService', () => ({
  accountService: {
    getMe: vi.fn().mockResolvedValue({ ok: true, data: { nombre: 'Carlos', apellidos: 'Galindo', username: 'carlos', telefono: '', nacionalidad: '', email: 'carlos@example.com', avatarUrl: null } }),
    updateMe: vi.fn(),
    checkUsername: vi.fn(),
    uploadAvatar: vi.fn(),
    verifyPassword: vi.fn(),
    requestEmailChange: vi.fn(),
    changePassword: vi.fn(),
    deleteAccount: vi.fn(),
  },
}))

vi.mock('../servicios/addressService', () => ({
  addressService: {
    listAddresses: vi.fn().mockResolvedValue({ ok: true, data: { envio: [], facturacion: [] } }),
    createAddress: vi.fn(),
    updateAddress: vi.fn(),
    setDefaultAddress: vi.fn(),
  },
}))

function renderApp(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </MemoryRouter>,
  )
}

describe('AppRouter — rutas de mi-cuenta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    accountService.getMe.mockResolvedValue({ ok: true, data: { nombre: 'Carlos', apellidos: 'Galindo', username: 'carlos', telefono: '', nacionalidad: '', email: 'carlos@example.com', avatarUrl: null } })
    addressService.listAddresses.mockResolvedValue({ ok: true, data: { envio: [], facturacion: [] } })
  })

  it('/mi-cuenta/perfil sin sesión redirige a /login', async () => {
    renderApp('/mi-cuenta/perfil')
    expect(await screen.findByLabelText(/nombre de usuario/i)).toBeInTheDocument()
  })

  it('/mi-cuenta/perfil con sesión iniciada renderiza la Vista Mi Cuenta', async () => {
    localStorage.setItem('session', JSON.stringify({ isLoggedIn: true, userId: '1', username: 'carlos' }))
    authService.silentRefresh.mockResolvedValueOnce({ ok: true, data: { userId: '1', username: 'carlos' } })

    renderApp('/mi-cuenta/perfil')

    expect(await screen.findByDisplayValue('Carlos')).toBeInTheDocument()
  })

  it('/mi-cuenta (sin sección) redirige a /mi-cuenta/perfil', async () => {
    localStorage.setItem('session', JSON.stringify({ isLoggedIn: true, userId: '1', username: 'carlos' }))
    authService.silentRefresh.mockResolvedValueOnce({ ok: true, data: { userId: '1', username: 'carlos' } })

    renderApp('/mi-cuenta')

    expect(await screen.findByDisplayValue('Carlos')).toBeInTheDocument()
  })
})
