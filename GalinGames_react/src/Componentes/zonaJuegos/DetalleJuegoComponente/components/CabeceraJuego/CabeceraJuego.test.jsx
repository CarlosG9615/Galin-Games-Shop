import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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
      { plataforma: 'Xbox', formatos: ['fisico', 'digital'], precio: 59.99, stock: 2 },
    ],
    ...overrides,
  }
}

function arbol({ juego, plataformaSeleccionada, onCambiarPlataforma, isAuthenticated }) {
  return (
    <MemoryRouter>
      <LanguageProvider>
        <AuthContext.Provider value={{ isAuthenticated, initializing: false }}>
          <CabeceraJuego juego={juego} plataformaSeleccionada={plataformaSeleccionada} onCambiarPlataforma={onCambiarPlataforma} />
        </AuthContext.Provider>
      </LanguageProvider>
    </MemoryRouter>
  )
}

function renderCabecera({ juego = juegoDeEjemplo(), plataformaSeleccionada = 'PC', onCambiarPlataforma = vi.fn(), isAuthenticated = true } = {}) {
  const utils = render(arbol({ juego, plataformaSeleccionada, onCambiarPlataforma, isAuthenticated }))
  return {
    ...utils,
    rerenderCon: (nuevaPlataforma) => utils.rerender(
      arbol({ juego, plataformaSeleccionada: nuevaPlataforma, onCambiarPlataforma, isAuthenticated }),
    ),
  }
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

  it('el icono de favoritos empieza inactivo y cambia de estado (aria-pressed) al pulsarlo', async () => {
    const user = userEvent.setup()
    renderCabecera()

    const botonFavorito = screen.getByRole('button', { name: 'Añadir a favoritos' })
    expect(botonFavorito).toHaveAttribute('aria-pressed', 'false')

    await user.click(botonFavorito)

    expect(screen.getByRole('button', { name: 'Quitar de favoritos' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Quitar de favoritos' }))

    expect(screen.getByRole('button', { name: 'Añadir a favoritos' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('el chip resume la plataforma, el stock y el formato seleccionados', () => {
    const { container } = renderCabecera({ plataformaSeleccionada: 'PC' })

    const chip = container.querySelector('.cabecera-juego__chip')
    expect(within(chip).getByText('PC')).toBeInTheDocument()
    expect(within(chip).getByText('En stock')).toBeInTheDocument()
    expect(within(chip).getByText('Digital')).toBeInTheDocument()
  })

  it('en PC (un único formato) el select de formato aparece deshabilitado, fijo en la única versión disponible', () => {
    renderCabecera({ plataformaSeleccionada: 'PC' })

    const selectFormato = screen.getByLabelText('Formato')
    expect(selectFormato).toBeDisabled()
    expect(selectFormato).toHaveValue('digital')
    expect(within(selectFormato).getAllByRole('option')).toHaveLength(1)
  })

  it('con físico y digital disponibles, el select de formato permite elegir y el chip refleja el cambio', async () => {
    const user = userEvent.setup()
    const { container } = renderCabecera({ plataformaSeleccionada: 'PlayStation' })

    const selectFormato = screen.getByLabelText('Formato')
    expect(selectFormato).not.toBeDisabled()
    expect(selectFormato).toHaveValue('fisico')

    const chip = container.querySelector('.cabecera-juego__chip')
    expect(within(chip).getByText('Físico')).toBeInTheDocument()

    await user.selectOptions(selectFormato, 'digital')

    expect(selectFormato).toHaveValue('digital')
    expect(within(chip).getByText('Digital')).toBeInTheDocument()
    expect(within(chip).queryByText('Físico')).not.toBeInTheDocument()
  })

  it('al cambiar de plataforma, el formato seleccionado se reinicia a la primera opción disponible de la nueva plataforma', async () => {
    const user = userEvent.setup()
    const { rerenderCon } = renderCabecera({ plataformaSeleccionada: 'PlayStation' })

    await user.selectOptions(screen.getByLabelText('Formato'), 'digital')
    expect(screen.getByLabelText('Formato')).toHaveValue('digital')

    // Xbox también tiene ambos formatos, pero el reinicio debe volver a "fisico" (el
    // primero de sus formatos), no arrastrar el "digital" elegido en PlayStation.
    rerenderCon('Xbox')

    expect(screen.getByLabelText('Formato')).toHaveValue('fisico')
    expect(screen.getByLabelText('Formato')).not.toBeDisabled()
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

  it('pinta el breadcrumb sobre el propio wallpaper, con la plataforma seleccionada', () => {
    const { container } = renderCabecera({ plataformaSeleccionada: 'PlayStation' })

    const breadcrumb = screen.getByRole('navigation', { name: 'Ruta de navegación' })
    // Dentro de .cabecera-juego__overlay (la capa sobre el wallpaper), no en un
    // contenedor aparte con el fondo normal de la página.
    expect(container.querySelector('.cabecera-juego__overlay')).toContainElement(breadcrumb)
    expect(within(breadcrumb).getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/')
    expect(within(breadcrumb).getByRole('link', { name: 'PlayStation' })).toHaveAttribute('href', '/juegos/playstation')
    expect(within(breadcrumb).getByText("Assassin's Creed Black Flag Resynced")).toHaveAttribute('aria-current', 'page')
  })
})
