import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../globalState/authContext'
import { ThemeProvider } from '../../../globalState/themeContext'
import { LanguageProvider } from '../../../globalState/languageContext'
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
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </MemoryRouter>,
  )
}

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('lang')
    vi.clearAllMocks()
  })

  it('sin sesión iniciada, muestra el icono de usuario (a /login) y el icono de carrito inerte', async () => {
    renderNavbar()

    const iconoUsuario = await screen.findByLabelText('Iniciar sesión')
    expect(iconoUsuario).toBeInTheDocument()
    expect(iconoUsuario.tagName).toBe('A')
    expect(iconoUsuario).toHaveAttribute('href', '/login')

    const iconoCarrito = screen.getByTitle(/carrito/i)
    expect(iconoCarrito).toHaveAttribute('aria-disabled', 'true')
  })

  it('con sesión iniciada, muestra los mismos iconos (carrito + usuario) y el icono de usuario abre un menú con "Cerrar sesión", que llama a logout', async () => {
    localStorage.setItem('session', JSON.stringify({ isLoggedIn: true, userId: '1', username: 'carlos' }))
    authService.silentRefresh.mockResolvedValueOnce({ ok: true, data: { userId: '1', username: 'carlos' } })
    authService.logout.mockResolvedValueOnce({ ok: true })

    const user = userEvent.setup()
    renderNavbar()

    const iconoUsuario = await screen.findByLabelText('Menú de usuario')
    expect(iconoUsuario.tagName).toBe('BUTTON')
    expect(screen.queryByLabelText('Iniciar sesión')).not.toBeInTheDocument()
    expect(screen.getByTitle(/carrito/i)).toBeInTheDocument()

    expect(screen.queryByText('Cerrar sesión')).not.toBeInTheDocument()
    await user.click(iconoUsuario)

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
    await screen.findByLabelText('Iniciar sesión')

    for (const texto of ['Juegos', 'Novedades', 'Comunidad']) {
      const elemento = screen.getByText(texto)
      expect(elemento.tagName).not.toBe('A')
      expect(elemento.tagName).not.toBe('BUTTON')
      expect(elemento).toHaveAttribute('aria-disabled', 'true')
    }
  })

  it('el LanguageToggle está presente y permite cambiar de idioma desde el Navbar', async () => {
    const user = userEvent.setup()
    renderNavbar()
    await screen.findByLabelText('Iniciar sesión')

    const botonIdioma = screen.getByRole('button', { name: 'Cambiar idioma' })
    expect(botonIdioma).toHaveTextContent('ES')

    await user.click(botonIdioma)
    await user.click(screen.getByRole('menuitem', { name: 'Inglés' }))

    expect(botonIdioma).toHaveTextContent('EN')
    expect(document.documentElement.getAttribute('lang')).toBe('en')
  })
})
