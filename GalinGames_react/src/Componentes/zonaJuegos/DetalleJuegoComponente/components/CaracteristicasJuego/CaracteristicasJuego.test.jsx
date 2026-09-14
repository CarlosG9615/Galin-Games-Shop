import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CaracteristicasJuego from './CaracteristicasJuego'

describe('CaracteristicasJuego', () => {
  it('muestra "Un jugador" cuando jugadores.tipo es individual', () => {
    render(<CaracteristicasJuego caracteristicas={{ jugadores: { tipo: 'individual' }, online: false, crossplay: false, hdr: false, mandosCompatibles: [] }} />)

    expect(screen.getByText('Un jugador')).toBeInTheDocument()
  })

  it('muestra "Multijugador (hasta N)" cuando jugadores.tipo es multijugador con máximo', () => {
    render(<CaracteristicasJuego caracteristicas={{ jugadores: { tipo: 'multijugador', maximo: 4 }, online: false, crossplay: false, hdr: false, mandosCompatibles: [] }} />)

    expect(screen.getByText('Multijugador (hasta 4)')).toBeInTheDocument()
  })

  it('muestra "Multijugador" sin número si no hay máximo definido', () => {
    render(<CaracteristicasJuego caracteristicas={{ jugadores: { tipo: 'multijugador' }, online: false, crossplay: false, hdr: false, mandosCompatibles: [] }} />)

    expect(screen.getByText('Multijugador')).toBeInTheDocument()
  })

  it('solo muestra los divs de online/crossplay/hdr cuando son true', () => {
    render(<CaracteristicasJuego caracteristicas={{ online: true, crossplay: false, hdr: true, mandosCompatibles: [] }} />)

    expect(screen.getByText('Modo online')).toBeInTheDocument()
    expect(screen.getByText('HDR')).toBeInTheDocument()
    expect(screen.queryByText('Crossplay')).not.toBeInTheDocument()
  })

  it('muestra los mandos compatibles solo si hay alguno', () => {
    render(<CaracteristicasJuego caracteristicas={{ online: false, crossplay: false, hdr: false, mandosCompatibles: ['DualSense', 'Xbox Wireless Controller'] }} />)

    expect(screen.getByText('Mandos compatibles: DualSense, Xbox Wireless Controller')).toBeInTheDocument()
  })

  it('no renderiza nada si ninguna característica está disponible', () => {
    const { container } = render(<CaracteristicasJuego caracteristicas={{ online: false, crossplay: false, hdr: false, mandosCompatibles: [] }} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('no renderiza nada si no recibe caracteristicas', () => {
    const { container } = render(<CaracteristicasJuego caracteristicas={undefined} />)

    expect(container).toBeEmptyDOMElement()
  })
})
