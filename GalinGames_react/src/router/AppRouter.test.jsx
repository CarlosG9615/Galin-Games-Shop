import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../globalState/authContext'
import { ThemeProvider } from '../globalState/themeContext'
import { LanguageProvider } from '../globalState/languageContext'
import { accountService } from '../servicios/accountService'
import { addressService } from '../servicios/addressService'
import { authService } from '../servicios/authService'
import { gameService } from '../servicios/gameService'
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

vi.mock('../servicios/gameService', () => ({
  gameService: {
    getJuegosPorPlataforma: vi.fn(),
    getJuegoPorId: vi.fn(),
    suscribirNotificacion: vi.fn(),
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

describe('AppRouter — rutas de juegos (públicas, sin sesión)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('/juegos/:plataforma renderiza la Vista de Plataforma sin exigir sesión', async () => {
    gameService.getJuegosPorPlataforma.mockResolvedValue({ ok: true, data: [] })

    renderApp('/juegos/pc')

    expect(await screen.findByRole('heading', { level: 1, name: 'PC' })).toBeInTheDocument()
    expect(gameService.getJuegosPorPlataforma).toHaveBeenCalledWith('pc')
  })

  it('/juegos/detalle/:id renderiza la Vista de Detalle sin exigir sesión', async () => {
    gameService.getJuegoPorId.mockResolvedValue({
      ok: true,
      data: {
        id: 'juego-1',
        nombre: 'Juego de prueba',
        descripcion: 'Sinopsis.',
        imagenPortada: '/portada.jpg',
        imagenWallpaper: null,
        estrenado: true,
        plataformaDestacada: null,
        caracteristicas: {},
        plataformas: [{ plataforma: 'PC', formatos: ['digital'], precio: 29.99, stock: 1 }],
      },
    })

    renderApp('/juegos/detalle/juego-1')

    expect(await screen.findByRole('heading', { name: 'Juego de prueba' })).toBeInTheDocument()
  })
})
