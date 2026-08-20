import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ErrorPage from './ErrorPage'

afterEach(() => {
  vi.useRealTimers()
})

describe('ErrorPage', () => {
  it('renderiza el código 404 y el mensaje correcto cuando code={404}', () => {
    render(
      <MemoryRouter>
        <ErrorPage code={404} />
      </MemoryRouter>
    )

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
  })

  it('renderiza la cuenta atrás cuando code={429} y retryAfter={10}', () => {
    render(
      <MemoryRouter>
        <ErrorPage code={429} retryAfter={10} />
      </MemoryRouter>
    )

    expect(screen.getByText(/10 segundos/)).toBeInTheDocument()
  })

  it('renderiza el código 410 (enlace caducado) para verificación de email', () => {
    render(
      <MemoryRouter>
        <ErrorPage code={410} />
      </MemoryRouter>
    )

    expect(screen.getByText('410')).toBeInTheDocument()
    expect(screen.getByText('Enlace caducado')).toBeInTheDocument()
  })

  it('el botón de volver está presente', () => {
    render(
      <MemoryRouter>
        <ErrorPage code={500} />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument()
  })
})
