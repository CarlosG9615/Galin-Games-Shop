import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../globalState/authContext'
import { ThemeProvider } from '../../../globalState/themeContext'
import Home from './Home'

vi.mock('../../../servicios/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    silentRefresh: vi.fn(),
  },
}))

describe('Home', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('renderiza el Navbar, el Hero y las 6 tarjetas de juego juntos', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <AuthProvider>
            <Home />
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Iniciar sesión')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'LO MÁS JUGADO' })).toBeInTheDocument()
    expect(screen.getAllByRole('img').filter((img) => img.closest('.game-card'))).toHaveLength(6)
  })
})
