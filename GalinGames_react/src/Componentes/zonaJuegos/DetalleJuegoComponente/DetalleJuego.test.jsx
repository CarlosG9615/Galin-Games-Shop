import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '../../../globalState/authContext'
import { LanguageProvider } from '../../../globalState/languageContext'
import { gameService } from '../../../servicios/gameService'
import DetalleJuego from './DetalleJuego'

vi.mock('../../../servicios/gameService', () => ({
  gameService: {
    getJuegoPorId: vi.fn(),
    suscribirNotificacion: vi.fn(),
  },
}))

function juegoDeEjemplo(overrides = {}) {
  return {
    id: 'juego-1',
    nombre: "Assassin's Creed Black Flag Resynced",
    descripcion: 'Sinopsis real del juego.',
    imagenPortada: '/assassins.jpg',
    imagenWallpaper: '/assassins-wallpaper.jpg',
    videoPreviewUrl: null,
    fechaEstreno: '2026-07-09T00:00:00.000Z',
    estrenado: true,
    plataformaDestacada: 'PlayStation',
    caracteristicas: { online: true, crossplay: false, hdr: false, mandosCompatibles: [] },
    plataformas: [
      { plataforma: 'PC', formatos: ['digital'], precio: 69.99, stock: 5 },
      { plataforma: 'PlayStation', formatos: ['fisico', 'digital'], precio: 69.99, stock: 3 },
      { plataforma: 'Xbox', formatos: ['digital'], precio: 69.99, stock: 0 },
    ],
    ...overrides,
  }
}

function renderDetalleJuego(url = '/juegos/detalle/juego-1') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <LanguageProvider>
        <AuthContext.Provider value={{ isAuthenticated: true, initializing: false }}>
          <Routes>
            <Route path="/juegos/detalle/:id" element={<DetalleJuego />} />
          </Routes>
        </AuthContext.Provider>
      </LanguageProvider>
    </MemoryRouter>,
  )
}

describe('DetalleJuego', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra un estado de carga mientras la petición está en curso', () => {
    gameService.getJuegoPorId.mockReturnValue(new Promise(() => {}))
    renderDetalleJuego()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('si el juego no existe (404), muestra el estado "juego no encontrado" traducible', async () => {
    gameService.getJuegoPorId.mockResolvedValue({ ok: false, status: 404 })
    renderDetalleJuego()

    expect(await screen.findByText('No hemos encontrado este juego.')).toBeInTheDocument()
  })

  it('si la petición falla por otro motivo, muestra un mensaje de error genérico', async () => {
    gameService.getJuegoPorId.mockResolvedValue({ ok: false, status: 500 })
    renderDetalleJuego()

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar los juegos. Inténtalo de nuevo.')
  })

  it('con éxito, renderiza la Cabecera (nombre) y la Sección INFO (descripción)', async () => {
    gameService.getJuegoPorId.mockResolvedValue({ ok: true, data: juegoDeEjemplo() })
    renderDetalleJuego()

    expect(await screen.findByRole('heading', { name: "Assassin's Creed Black Flag Resynced" })).toBeInTheDocument()
    expect(screen.getByText('Sinopsis real del juego.')).toBeInTheDocument()
  })

  it('preselecciona la plataforma del query param si es válida para el juego', async () => {
    gameService.getJuegoPorId.mockResolvedValue({ ok: true, data: juegoDeEjemplo() })
    renderDetalleJuego('/juegos/detalle/juego-1?plataforma=Xbox')

    expect(await screen.findByLabelText('Plataforma')).toHaveValue('Xbox')
  })

  it('si el query param no es válido, preselecciona la plataformaDestacada del juego', async () => {
    gameService.getJuegoPorId.mockResolvedValue({ ok: true, data: juegoDeEjemplo() })
    renderDetalleJuego('/juegos/detalle/juego-1?plataforma=Nintendo')

    expect(await screen.findByLabelText('Plataforma')).toHaveValue('PlayStation')
  })

  it('sin query param ni plataformaDestacada válida, preselecciona la primera plataforma disponible', async () => {
    gameService.getJuegoPorId.mockResolvedValue({ ok: true, data: juegoDeEjemplo({ plataformaDestacada: null }) })
    renderDetalleJuego('/juegos/detalle/juego-1')

    expect(await screen.findByLabelText('Plataforma')).toHaveValue('PC')
  })

  it('cambiar de plataforma en el select no vuelve a pedir el juego al backend', async () => {
    gameService.getJuegoPorId.mockResolvedValue({ ok: true, data: juegoDeEjemplo() })
    const user = userEvent.setup()
    renderDetalleJuego('/juegos/detalle/juego-1?plataforma=PC')

    await screen.findByLabelText('Plataforma')
    expect(gameService.getJuegoPorId).toHaveBeenCalledTimes(1)

    await user.selectOptions(screen.getByLabelText('Plataforma'), 'Xbox')

    expect(screen.getByLabelText('Plataforma')).toHaveValue('Xbox')
    expect(gameService.getJuegoPorId).toHaveBeenCalledTimes(1)
  })
})
