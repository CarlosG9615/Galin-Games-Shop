import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SeccionInfo from './SeccionInfo'

describe('SeccionInfo', () => {
  it('pinta la descripción del backend tal cual, sin texto de juego hardcodeado', () => {
    render(
      <SeccionInfo
        descripcion="Sinopsis real del juego, tal y como la devuelve el backend."
        plataforma="PC"
        especificacionesPC={undefined}
        especificacionesConsola={undefined}
        caracteristicas={undefined}
      />,
    )

    expect(screen.getByText('Sinopsis real del juego, tal y como la devuelve el backend.')).toBeInTheDocument()
  })

  it('agrupa EspecificacionesTecnicas y CaracteristicasJuego con los datos recibidos', () => {
    render(
      <SeccionInfo
        descripcion="Sinopsis."
        plataforma="PC"
        especificacionesPC={{ minimas: { cpu: 'Intel i5' } }}
        especificacionesConsola={undefined}
        caracteristicas={{ online: true, crossplay: false, hdr: false, mandosCompatibles: [] }}
      />,
    )

    expect(screen.getByText('Requisitos mínimos')).toBeInTheDocument()
    expect(screen.getByText('Intel i5')).toBeInTheDocument()
    expect(screen.getByText('Modo online')).toBeInTheDocument()
  })
})
