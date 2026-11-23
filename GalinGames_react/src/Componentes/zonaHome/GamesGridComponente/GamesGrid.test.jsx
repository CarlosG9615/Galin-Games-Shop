import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../../../globalState/languageContext'
import { gameService } from '../../../servicios/gameService'
import GamesGrid from './GamesGrid'

vi.mock('../../../servicios/gameService', () => ({
  gameService: {
    getJuegosDestacados: vi.fn(),
  },
}))

function juegosDestacadosDeEjemplo() {
  return Array.from({ length: 6 }, (_, i) => ({
    id: `juego-${i}`,
    nombre: `Juego ${i}`,
    imagenPortada: `/juego-${i}.jpg`,
    plataforma: 'PC',
    precio: 59.99,
  }))
}

function renderGamesGrid() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <GamesGrid />
      </LanguageProvider>
    </MemoryRouter>,
  )
}

describe('GamesGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra un estado de carga mientras la petición está en curso', () => {
    gameService.getJuegosDestacados.mockReturnValue(new Promise(() => {}))
    renderGamesGrid()

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renderiza exactamente 6 tarjetas de juego con los datos del backend', async () => {
    gameService.getJuegosDestacados.mockResolvedValue({ ok: true, data: juegosDestacadosDeEjemplo() })
    renderGamesGrid()

    expect(await screen.findAllByRole('img')).toHaveLength(6)
  })

  it('renderiza "TENDENCIAS" como título de la sección, en el mismo contenedor que las tarjetas', async () => {
    gameService.getJuegosDestacados.mockResolvedValue({ ok: true, data: juegosDestacadosDeEjemplo() })
    const { container } = renderGamesGrid()

    await screen.findAllByRole('img')

    const titulo = screen.getByRole('heading', { level: 2, name: /TENDENCIAS/ })
    const seccion = container.querySelector('.games-grid')
    expect(seccion).toContainElement(titulo)
    expect(seccion.querySelector('.games-grid__lista')).not.toBeNull()
  })

  it('si la petición falla, muestra un mensaje de error traducible en vez del grid', async () => {
    gameService.getJuegosDestacados.mockResolvedValue({ ok: false, status: 500 })
    renderGamesGrid()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
