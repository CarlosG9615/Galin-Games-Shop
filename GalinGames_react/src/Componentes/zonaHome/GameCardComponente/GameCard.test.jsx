import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GameCard from './GameCard'

describe('GameCard', () => {
  it('renderiza la imagen con el src y alt recibidos', () => {
    render(<GameCard src="/assassins.jpg" alt="Assassin's Creed Black Flag Resynced" />)

    const img = screen.getByAltText("Assassin's Creed Black Flag Resynced")
    expect(img).toHaveAttribute('src', '/assassins.jpg')
  })

  it('al fallar la carga de la imagen, muestra el fallback con el alt visible en vez del icono roto', () => {
    render(<GameCard src="/no-existe.jpg" alt="Juego de prueba" />)

    const img = screen.getByAltText('Juego de prueba')
    fireEvent.error(img)

    expect(screen.queryByRole('img', { name: 'Juego de prueba' })).toHaveTextContent('Juego de prueba')
    expect(screen.queryByAltText('Juego de prueba')).not.toBeInTheDocument()
  })
})
