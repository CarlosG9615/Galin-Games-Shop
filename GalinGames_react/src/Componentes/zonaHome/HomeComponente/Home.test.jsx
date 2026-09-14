import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../globalState/authContext'
import { ThemeProvider } from '../../../globalState/themeContext'
import { LanguageProvider } from '../../../globalState/languageContext'
import { gameService } from '../../../servicios/gameService'
import Home from './Home'

vi.mock('../../../servicios/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    silentRefresh: vi.fn(),
  },
}))

vi.mock('../../../servicios/gameService', () => ({
  gameService: {
    getJuegosDestacados: vi.fn(),
  },
}))

describe('Home', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('renderiza el Navbar, el Hero y las 6 tarjetas de juego juntos', async () => {
    gameService.getJuegosDestacados.mockResolvedValue({
      ok: true,
      data: Array.from({ length: 6 }, (_, i) => ({
        id: `juego-${i}`,
        nombre: `Juego ${i}`,
        imagenPortada: `/juego-${i}.jpg`,
        plataforma: 'PC',
        precio: 59.99,
      })),
    })

    render(
      <MemoryRouter>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <Home />
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByLabelText('Iniciar sesión')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'LO MÁS JUGADO' })).toBeInTheDocument()
    expect((await screen.findAllByRole('img')).filter((img) => img.closest('.game-card'))).toHaveLength(6)
  })
})
