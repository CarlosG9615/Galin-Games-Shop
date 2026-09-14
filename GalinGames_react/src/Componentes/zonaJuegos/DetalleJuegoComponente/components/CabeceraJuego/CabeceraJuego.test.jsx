import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../../../../../globalState/authContext'
import { LanguageProvider } from '../../../../../globalState/languageContext'
import { gameService } from '../../../../../servicios/gameService'
import CabeceraJuego from './CabeceraJuego'

vi.mock('../../../../../servicios/gameService', () => ({
  gameService: {
    suscribirNotificacion: vi.fn(),
  },
}))

function juegoDeEjemplo(overrides = {}) {
  return {
    id: 'juego-1',
    nombre: "Assassin's Creed Black Flag Resynced",
    imagenPortada: '/assassins.jpg',
    imagenWallpaper: '/assassins-wallpaper.jpg',
    estrenado: true,
    plataformas: [
      { plataforma: 'PC', formatos: ['digital'], precio: 69.99, stock: 5 },
      { plataforma: 'PlayStation', formatos: ['fisico', 'digital'], precio: 69.99, stock: 0 },
    ],
    ...overrides,
  }
}

function renderCabecera({ juego = juegoDeEjemplo(), plataformaSeleccionada = 'PC', onCambiarPlataforma = vi.fn(), isAuthenticated = true } = {}) {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <AuthContext.Provider value={{ isAuthenticated, initializing: false }}>
          <CabeceraJuego juego={juego} plataformaSeleccionada={plataformaSeleccionada} onCambiarPlataforma={onCambiarPlataforma} />
        </AuthContext.Provider>
      </LanguageProvider>
    </MemoryRouter>,
  )
}

describe('CabeceraJuego', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra el nombre, el select con las plataformas del juego y el precio de la combinación seleccionada', () => {
    renderCabecera()

    expect(screen.getByRole('heading', { name: "Assassin's Creed Black Flag Resynced" })).toBeInTheDocument()
    const select = screen.getByLabelText('Plataforma')
    expect(select).toHaveValue('PC')
    expect(screen.getByText(/69,99.€/)).toBeInTheDocument()
  })

  it('en PC muestra "Digital" como formato', () => {
    renderCabecera({ plataformaSeleccionada: 'PC' })

    expect(screen.getByText('Digital')).toBeInTheDocument()
  })

  it('con ambos formatos disponibles, muestra "Físico y digital"', () => {
    renderCabecera({ plataformaSeleccionada: 'PlayStation' })

    expect(screen.getByText('Físico y digital')).toBeInTheDocument()
  })

  it('con stock > 0 en un juego estrenado, muestra el chip "En stock" y el botón "Comprar"', () => {
    renderCabecera({ plataformaSeleccionada: 'PC' })

    expect(screen.getByText('En stock')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Comprar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Avisarme cuando haya stock' })).not.toBeInTheDocument()
  })

  it('con stock 0 en un juego estrenado, muestra el chip "Sin stock" y el botón "Avisarme" en vez de "Comprar"', () => {
    renderCabecera({ plataformaSeleccionada: 'PlayStation' })

    expect(screen.getByText('Sin stock')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Comprar' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Avisarme cuando haya stock' })).toBeInTheDocument()
  })

  it('un juego en preventa (no estrenado) muestra "Reservar", nunca "Comprar", con independencia del stock', () => {
    renderCabecera({ juego: juegoDeEjemplo({ estrenado: false }), plataformaSeleccionada: 'PC' })

    expect(screen.getByRole('button', { name: 'Reservar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Comprar' })).not.toBeInTheDocument()
  })

  it('cambiar el select llama a onCambiarPlataforma con la nueva plataforma', async () => {
    const onCambiarPlataforma = vi.fn()
    const user = userEvent.setup()
    renderCabecera({ onCambiarPlataforma })

    await user.selectOptions(screen.getByLabelText('Plataforma'), 'PlayStation')

    expect(onCambiarPlataforma).toHaveBeenCalledWith('PlayStation')
  })

  it('sin sesión iniciada, pulsar "Avisarme" redirige a /login sin llamar al backend', async () => {
    const user = userEvent.setup()
    renderCabecera({ plataformaSeleccionada: 'PlayStation', isAuthenticated: false })

    await user.click(screen.getByRole('button', { name: 'Avisarme cuando haya stock' }))

    expect(gameService.suscribirNotificacion).not.toHaveBeenCalled()
  })

  it('con sesión iniciada, pulsar "Avisarme" llama a suscribirNotificacion y muestra la confirmación', async () => {
    gameService.suscribirNotificacion.mockResolvedValue({ ok: true, data: { message: 'ok' } })
    const user = userEvent.setup()
    renderCabecera({ plataformaSeleccionada: 'PlayStation', isAuthenticated: true })

    await user.click(screen.getByRole('button', { name: 'Avisarme cuando haya stock' }))

    expect(gameService.suscribirNotificacion).toHaveBeenCalledWith('juego-1', 'PlayStation')
    expect(await screen.findByText('Ya te avisaremos cuando haya stock')).toBeInTheDocument()
  })

  it('si la suscripción falla, muestra un mensaje de error traducible', async () => {
    gameService.suscribirNotificacion.mockResolvedValue({ ok: false, status: 500 })
    const user = userEvent.setup()
    renderCabecera({ plataformaSeleccionada: 'PlayStation', isAuthenticated: true })

    await user.click(screen.getByRole('button', { name: 'Avisarme cuando haya stock' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo registrar el aviso. Inténtalo de nuevo.')
  })

  it('sin imagen wallpaper, aplica el fondo de respaldo en vez de un hueco vacío', () => {
    const { container } = renderCabecera({ juego: juegoDeEjemplo({ imagenWallpaper: null }) })

    expect(container.querySelector('.cabecera-juego--sin-wallpaper')).not.toBeNull()
  })
})
