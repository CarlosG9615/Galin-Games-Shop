import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Breadcrumb from './Breadcrumb'

function renderBreadcrumb(items) {
  return render(
    <MemoryRouter>
      <Breadcrumb items={items} ariaLabel="Ruta de navegación" />
    </MemoryRouter>,
  )
}

describe('Breadcrumb', () => {
  it('pinta un enlace por cada item salvo el último, que es el actual', () => {
    renderBreadcrumb([
      { label: 'Inicio', to: '/' },
      { label: 'Juegos', to: '/juegos' },
      { label: 'PC' },
    ])

    const enlaceInicio = screen.getByRole('link', { name: 'Inicio' })
    const enlaceJuegos = screen.getByRole('link', { name: 'Juegos' })
    expect(enlaceInicio).toHaveAttribute('href', '/')
    expect(enlaceJuegos).toHaveAttribute('href', '/juegos')

    const actual = screen.getByText('PC')
    expect(actual.tagName).toBe('SPAN')
    expect(actual).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('link', { name: 'PC' })).not.toBeInTheDocument()
  })

  it('usa el aria-label recibido en el nav', () => {
    renderBreadcrumb([{ label: 'Inicio' }])

    expect(screen.getByRole('navigation', { name: 'Ruta de navegación' })).toBeInTheDocument()
  })

  it('un item intermedio sin `to` se pinta como texto, no como enlace', () => {
    renderBreadcrumb([
      { label: 'Inicio', to: '/' },
      { label: 'Sin ruta' },
      { label: 'Actual' },
    ])

    expect(screen.queryByRole('link', { name: 'Sin ruta' })).not.toBeInTheDocument()
    expect(screen.getByText('Sin ruta')).toBeInTheDocument()
  })
})
