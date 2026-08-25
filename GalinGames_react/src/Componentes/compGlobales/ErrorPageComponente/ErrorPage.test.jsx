import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ErrorPage from './ErrorPage'
import { AuthProvider } from '../../../globalState/authContext'
import { ThemeProvider } from '../../../globalState/themeContext'
import { LanguageProvider } from '../../../globalState/languageContext'

vi.mock('../../../servicios/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    silentRefresh: vi.fn(),
  },
}))

afterEach(() => {
  vi.useRealTimers()
})

function renderErrorPage(props) {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <ErrorPage {...props} />
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </MemoryRouter>
  )
}

describe('ErrorPage', () => {
  it('renderiza el código 404 y el mensaje correcto cuando code={404}', () => {
    renderErrorPage({ code: 404 })

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
  })

  it('renderiza la cuenta atrás cuando code={429} y retryAfter={10}', () => {
    renderErrorPage({ code: 429, retryAfter: 10 })

    expect(screen.getByText(/10 segundos/)).toBeInTheDocument()
  })

  it('renderiza el código 410 (enlace caducado) para verificación de email', () => {
    renderErrorPage({ code: 410 })

    expect(screen.getByText('410')).toBeInTheDocument()
    expect(screen.getByText('Enlace caducado')).toBeInTheDocument()
  })

  it('el botón de volver está presente', () => {
    renderErrorPage({ code: 500 })

    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument()
  })
})
