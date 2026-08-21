import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { useContext } from 'react'
import { ThemeContext, ThemeProvider } from './themeContext'

function Probe() {
  const ctx = useContext(ThemeContext)
  return (
    <div>
      <span data-testid="theme">{ctx.theme}</span>
      <button onClick={ctx.toggleTheme}>toggle</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('aplica el tema azul por defecto cuando no hay nada en localStorage', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>)

    expect(screen.getByTestId('theme').textContent).toBe('azul')
    expect(document.documentElement.getAttribute('data-theme')).toBe('azul')
  })

  it('aplica el tema guardado en localStorage al montar', () => {
    localStorage.setItem('gg-theme', 'rojo')

    render(<ThemeProvider><Probe /></ThemeProvider>)

    expect(screen.getByTestId('theme').textContent).toBe('rojo')
    expect(document.documentElement.getAttribute('data-theme')).toBe('rojo')
  })

  it('usa azul por defecto si el valor guardado no es azul ni rojo', () => {
    localStorage.setItem('gg-theme', 'purpura')

    render(<ThemeProvider><Probe /></ThemeProvider>)

    expect(screen.getByTestId('theme').textContent).toBe('azul')
  })

  it('toggleTheme alterna el tema y lo persiste en localStorage', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>)

    act(() => {
      screen.getByText('toggle').click()
    })

    expect(screen.getByTestId('theme').textContent).toBe('rojo')
    expect(localStorage.getItem('gg-theme')).toBe('rojo')
    expect(document.documentElement.getAttribute('data-theme')).toBe('rojo')

    act(() => {
      screen.getByText('toggle').click()
    })

    expect(screen.getByTestId('theme').textContent).toBe('azul')
    expect(localStorage.getItem('gg-theme')).toBe('azul')
  })

  it('cambiar de tema no toca la sesión de autenticación guardada en localStorage', () => {
    localStorage.setItem('session', JSON.stringify({ isLoggedIn: true, userId: '1', username: 'carlos' }))

    render(<ThemeProvider><Probe /></ThemeProvider>)

    act(() => {
      screen.getByText('toggle').click()
    })

    expect(JSON.parse(localStorage.getItem('session'))).toEqual({ isLoggedIn: true, userId: '1', username: 'carlos' })
  })
})
