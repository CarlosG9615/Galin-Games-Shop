import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EspecificacionesTecnicas from './EspecificacionesTecnicas'

describe('EspecificacionesTecnicas', () => {
  it('en PC, muestra los bloques de mínimas y recomendadas con sus campos', () => {
    render(
      <EspecificacionesTecnicas
        plataforma="PC"
        especificacionesPC={{
          minimas: { cpu: 'Intel i5', ram: '8 GB', gpu: 'GTX 1060', almacenamiento: '50 GB', sistemaOperativo: 'Windows 10' },
          recomendadas: { cpu: 'Intel i7', ram: '16 GB', gpu: 'RTX 3070', almacenamiento: '50 GB SSD', sistemaOperativo: 'Windows 11' },
        }}
      />,
    )

    expect(screen.getByText('Requisitos mínimos')).toBeInTheDocument()
    expect(screen.getByText('Requisitos recomendados')).toBeInTheDocument()
    expect(screen.getByText('Intel i5')).toBeInTheDocument()
    expect(screen.getByText('RTX 3070')).toBeInTheDocument()
  })

  it('en PC, oculta el bloque de recomendadas si no hay datos para él', () => {
    render(
      <EspecificacionesTecnicas
        plataforma="PC"
        especificacionesPC={{ minimas: { cpu: 'Intel i5' } }}
      />,
    )

    expect(screen.getByText('Requisitos mínimos')).toBeInTheDocument()
    expect(screen.queryByText('Requisitos recomendados')).not.toBeInTheDocument()
  })

  it('en PC, no renderiza nada si no hay especificacionesPC', () => {
    const { container } = render(<EspecificacionesTecnicas plataforma="PC" especificacionesPC={undefined} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('en consola, muestra almacenamiento y notas', () => {
    render(
      <EspecificacionesTecnicas
        plataforma="PlayStation"
        especificacionesConsola={{ almacenamiento: '80 GB', notas: ['PS5 Pro Enhanced'] }}
      />,
    )

    expect(screen.getByText('80 GB')).toBeInTheDocument()
    expect(screen.getByText('PS5 Pro Enhanced')).toBeInTheDocument()
  })

  it('en consola, no renderiza nada si no hay especificacionesConsola', () => {
    const { container } = render(<EspecificacionesTecnicas plataforma="Xbox" especificacionesConsola={undefined} />)

    expect(container).toBeEmptyDOMElement()
  })
})
