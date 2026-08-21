import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../globalState/authContext'
import { ThemeProvider } from '../../../globalState/themeContext'
import { authService } from '../../../servicios/authService'
import Navbar from './Navbar'

vi.mock('../../../servicios/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    silentRefresh: vi.fn(),
  },
}))

function renderNavbar() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    vi.clearAllMocks()
  })

  it('sin sesión iniciada, muestra "Iniciar sesión" y "Registrarse"', async () => {
    renderNavbar()

    expect(await screen.findByText('Iniciar sesión')).toBeInTheDocument()
    expect(screen.getByText('Registrarse')).toBeInTheDocument()
  })

  it('con sesión iniciada, muestra el username y el botón de cerrar sesión, que llama a logout', async () => {
    localStorage.setItem('session', JSON.stringify({ isLoggedIn: true, userId: '1', username: 'carlos' }))
    authService.silentRefresh.mockResolvedValueOnce({ ok: true, data: { userId: '1', username: 'carlos' } })
    authService.logout.mockResolvedValueOnce({ ok: true })

    renderNavbar()

    expect(await screen.findByText('carlos')).toBeInTheDocument()
    expect(screen.queryByText('Iniciar sesión')).not.toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByText('Cerrar sesión'))

    await waitFor(() => expect(authService.logout).toHaveBeenCalledTimes(1))
  })

  it('el logotipo cambia de src al pulsar el ThemeToggle', async () => {
    const user = userEvent.setup()
    renderNavbar()

    const logo = await screen.findByAltText('GG Games')
    expect(logo).toHaveAttribute('src', '/logo1.png')

    await user.click(screen.getByRole('button', { name: /cambiar a tema rojo/i }))

    expect(logo).toHaveAttribute('src', '/logo2.png')
  })

  it('los enlaces "Juegos", "Novedades" y "Comunidad" no son elementos navegables', async () => {
    renderNavbar()
    await screen.findByText('Iniciar sesión')

    for (const texto of ['Juegos', 'Novedades', 'Comunidad']) {
      const elemento = screen.getByText(texto)
      expect(elemento.tagName).not.toBe('A')
      expect(elemento.tagName).not.toBe('BUTTON')
      expect(elemento).toHaveAttribute('aria-disabled', 'true')
    }
  })
})
