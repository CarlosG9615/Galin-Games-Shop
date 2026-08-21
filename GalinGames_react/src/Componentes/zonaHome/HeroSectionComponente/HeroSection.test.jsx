import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '../../../globalState/themeContext'
import HeroSection from './HeroSection'

function renderHero() {
  return render(
    <ThemeProvider>
      <HeroSection />
    </ThemeProvider>,
  )
}

describe('HeroSection', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('renderiza el título y el botón "Ver todos" no navegable', () => {
    renderHero()

    expect(screen.getByRole('heading', { level: 1, name: 'LO MÁS JUGADO' })).toBeInTheDocument()
    const boton = screen.getByText(/Ver todos/)
    expect(boton.tagName).not.toBe('A')
    expect(boton.tagName).not.toBe('BUTTON')
    expect(boton).toHaveAttribute('aria-disabled', 'true')
  })

  it('usa mando.png como imagen de fondo con el tema azul (por defecto)', () => {
    const { container } = renderHero()

    const hero = container.querySelector('.hero')
    expect(hero.style.getPropertyValue('--hero-imagen-mando')).toContain('/mando.png')
  })

  it('usa mando2.png como imagen de fondo con el tema rojo', () => {
    localStorage.setItem('gg-theme', 'rojo')
    const { container } = renderHero()

    const hero = container.querySelector('.hero')
    expect(hero.style.getPropertyValue('--hero-imagen-mando')).toContain('/mando2.png')
  })
})
