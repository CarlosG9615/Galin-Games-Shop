import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../../../globalState/themeContext'
import ThemeToggle from './ThemeToggle'

function renderThemeToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('empieza con aria-pressed="false" (tema azul por defecto)', () => {
    renderThemeToggle()

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('al hacer click alterna el tema y aria-pressed pasa a "true"', async () => {
    const user = userEvent.setup()
    renderThemeToggle()

    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement.getAttribute('data-theme')).toBe('rojo')
  })

  it('es activable con teclado (Enter)', async () => {
    const user = userEvent.setup()
    renderThemeToggle()

    const boton = screen.getByRole('button')
    boton.focus()
    await user.keyboard('{Enter}')

    expect(boton).toHaveAttribute('aria-pressed', 'true')
  })

  it('es activable con teclado (Espacio)', async () => {
    const user = userEvent.setup()
    renderThemeToggle()

    const boton = screen.getByRole('button')
    boton.focus()
    await user.keyboard(' ')

    expect(boton).toHaveAttribute('aria-pressed', 'true')
  })

  it('el aria-label indica el tema al que se cambiará', () => {
    renderThemeToggle()

    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Cambiar a tema rojo')
  })
})
