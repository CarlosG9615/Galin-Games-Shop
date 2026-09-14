import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../../../globalState/languageContext'
import GameCard from './GameCard'

function renderGameCard(props) {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <GameCard
          id="abc123"
          imagenPortada="/assassins.jpg"
          nombre="Assassin's Creed Black Flag Resynced"
          plataforma="PC"
          precio={69.99}
          {...props}
        />
      </LanguageProvider>
    </MemoryRouter>,
  )
}

function mockMatchMedia(matches) {
  window.matchMedia = vi.fn().mockReturnValue({ matches })
}

describe('GameCard', () => {
  afterEach(() => {
    delete window.matchMedia
  })

  it('renderiza la imagen de portada con el nombre como alt', () => {
    renderGameCard()

    const img = screen.getByAltText("Assassin's Creed Black Flag Resynced")
    expect(img).toHaveAttribute('src', '/assassins.jpg')
  })

  it('al fallar la carga de la imagen, muestra el fallback con el nombre visible en vez del icono roto', () => {
    renderGameCard({ imagenPortada: '/no-existe.jpg' })

    const img = screen.getByAltText("Assassin's Creed Black Flag Resynced")
    fireEvent.error(img)

    expect(screen.queryByRole('img', { name: "Assassin's Creed Black Flag Resynced" })).toHaveTextContent("Assassin's Creed Black Flag Resynced")
    expect(screen.queryByAltText("Assassin's Creed Black Flag Resynced")).not.toBeInTheDocument()
  })

  it('muestra el texto "<nombre>" - <plataforma>  <precio formateado en EUR>', () => {
    renderGameCard({ plataforma: 'PlayStation', precio: 69.99 })

    expect(screen.getByText(/Assassin's Creed Black Flag Resynced.*PlayStation.*69,99/)).toBeInTheDocument()
  })

  it('envuelve la tarjeta en un enlace a la Vista de Detalle con la plataforma como query param', () => {
    renderGameCard({ id: 'xyz789', plataforma: 'Xbox' })

    const enlace = screen.getByRole('link')
    expect(enlace).toHaveAttribute('href', '/juegos/detalle/xyz789?plataforma=Xbox')
  })

  it('sin vídeo de preview, mantiene la imagen visible al pasar el ratón', () => {
    mockMatchMedia(true)
    renderGameCard({ videoPreviewUrl: null })

    fireEvent.mouseEnter(screen.getByRole('link'))

    expect(screen.getByAltText("Assassin's Creed Black Flag Resynced")).toBeInTheDocument()
    expect(document.querySelector('video')).not.toBeInTheDocument()
  })

  it('con vídeo de preview y puntero de ratón, sustituye la imagen por el vídeo en hover y la restaura al salir', () => {
    mockMatchMedia(true)
    renderGameCard({ videoPreviewUrl: '/preview.mp4' })

    fireEvent.mouseEnter(screen.getByRole('link'))
    const video = document.querySelector('video')
    expect(video).toHaveAttribute('src', '/preview.mp4')
    expect(screen.queryByAltText("Assassin's Creed Black Flag Resynced")).not.toBeInTheDocument()

    fireEvent.mouseLeave(screen.getByRole('link'))
    expect(document.querySelector('video')).not.toBeInTheDocument()
    expect(screen.getByAltText("Assassin's Creed Black Flag Resynced")).toBeInTheDocument()
  })

  it('en dispositivos sin puntero de ratón (matchMedia sin match) no activa el vídeo en hover', () => {
    mockMatchMedia(false)
    renderGameCard({ videoPreviewUrl: '/preview.mp4' })

    fireEvent.mouseEnter(screen.getByRole('link'))

    expect(document.querySelector('video')).not.toBeInTheDocument()
  })
})
