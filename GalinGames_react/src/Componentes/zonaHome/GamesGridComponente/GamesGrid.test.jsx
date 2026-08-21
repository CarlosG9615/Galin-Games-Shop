import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import GamesGrid from './GamesGrid'

describe('GamesGrid', () => {
  it('renderiza exactamente 6 tarjetas de juego', () => {
    render(<GamesGrid />)

    expect(screen.getAllByRole('img')).toHaveLength(6)
  })

  it('renderiza "TENDENCIAS" como título de la sección, en el mismo contenedor que las tarjetas', () => {
    const { container } = render(<GamesGrid />)

    const titulo = screen.getByRole('heading', { level: 2, name: /TENDENCIAS/ })
    const seccion = container.querySelector('.games-grid')
    expect(seccion).toContainElement(titulo)
    expect(seccion.querySelector('.games-grid__lista')).not.toBeNull()
  })
})
