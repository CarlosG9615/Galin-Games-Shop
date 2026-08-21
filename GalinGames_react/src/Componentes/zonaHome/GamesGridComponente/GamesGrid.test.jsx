import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import GamesGrid from './GamesGrid'

describe('GamesGrid', () => {
  it('renderiza exactamente 6 tarjetas de juego', () => {
    render(<GamesGrid />)

    expect(screen.getAllByRole('img')).toHaveLength(6)
  })
})
