import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from '../../../globalState/languageContext'
import { gameService } from '../../../servicios/gameService'
import VistaPlataforma from './VistaPlataforma'

vi.mock('../../../servicios/gameService', () => ({
  gameService: {
    getJuegosPorPlataforma: vi.fn(),
  },
}))

function renderVistaPlataforma(slug = 'pc') {
  return render(
    <MemoryRouter initialEntries={[`/juegos/${slug}`]}>
      <LanguageProvider>
        <Routes>
          <Route path="/juegos/:plataforma" element={<VistaPlataforma />} />
        </Routes>
      </LanguageProvider>
    </MemoryRouter>,
  )
}

function juegosDeEjemplo() {
  return [
    { id: 'juego-1', nombre: 'Juego 1', imagenPortada: '/juego-1.jpg', precio: 49.99 },
    { id: 'juego-2', nombre: 'Juego 2', imagenPortada: '/juego-2.jpg', precio: 59.99 },
  ]
}

describe('VistaPlataforma', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('pide los juegos de la plataforma de la URL y pinta título, subtítulo y breadcrumb', async () => {
    gameService.getJuegosPorPlataforma.mockResolvedValue({ ok: true, data: juegosDeEjemplo() })
    renderVistaPlataforma('playstation')

    expect(gameService.getJuegosPorPlataforma).toHaveBeenCalledWith('playstation')
    expect(screen.getByRole('heading', { level: 1, name: 'PlayStation' })).toBeInTheDocument()
    expect(screen.getByText('El catálogo completo para tu PlayStation.')).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: 'Ruta de navegación' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/')

    await screen.findAllByRole('img')
  })

  it('muestra un estado de carga mientras la petición está en curso', () => {
    gameService.getJuegosPorPlataforma.mockReturnValue(new Promise(() => {}))
    renderVistaPlataforma('pc')

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('pinta una tarjeta por juego, con la plataforma de la URL resuelta como prop', async () => {
    gameService.getJuegosPorPlataforma.mockResolvedValue({ ok: true, data: juegosDeEjemplo() })
    renderVistaPlataforma('xbox')

    const enlaces = await screen.findAllByRole('link', { name: /Juego/ })
    expect(enlaces).toHaveLength(2)
    expect(enlaces[0]).toHaveAttribute('href', '/juegos/detalle/juego-1?plataforma=Xbox')
    expect(enlaces[1]).toHaveAttribute('href', '/juegos/detalle/juego-2?plataforma=Xbox')
  })

  it('si no hay juegos para esa plataforma, muestra un mensaje de estado vacío traducible', async () => {
    gameService.getJuegosPorPlataforma.mockResolvedValue({ ok: true, data: [] })
    renderVistaPlataforma('nintendo')

    expect(await screen.findByText('Todavía no hay juegos disponibles para esta plataforma.')).toBeInTheDocument()
  })

  it('si la petición falla, muestra un mensaje de error traducible', async () => {
    gameService.getJuegosPorPlataforma.mockResolvedValue({ ok: false, status: 404 })
    renderVistaPlataforma('pc')

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
