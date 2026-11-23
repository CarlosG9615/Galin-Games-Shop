import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PlataformasDropdown from './PlataformasDropdown'

function renderDropdown(props) {
  return render(
    <MemoryRouter>
      <PlataformasDropdown {...props} />
    </MemoryRouter>,
  )
}

describe('PlataformasDropdown', () => {
  it('empieza cerrado', () => {
    renderDropdown()

    const boton = screen.getByRole('button', { name: 'Juegos' })
    expect(boton).toHaveAttribute('aria-haspopup', 'true')
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('al pulsar el botón despliega las 4 plataformas con enlace a su Vista de Plataforma', async () => {
    const user = userEvent.setup()
    renderDropdown()

    await user.click(screen.getByRole('button', { name: 'Juegos' }))

    expect(screen.getByRole('button', { name: 'Juegos' })).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('menu')
    expect(menu).toBeInTheDocument()

    expect(screen.getByRole('menuitem', { name: 'PC' })).toHaveAttribute('href', '/juegos/pc')
    expect(screen.getByRole('menuitem', { name: 'PlayStation' })).toHaveAttribute('href', '/juegos/playstation')
    expect(screen.getByRole('menuitem', { name: 'Xbox' })).toHaveAttribute('href', '/juegos/xbox')
    expect(screen.getByRole('menuitem', { name: 'Nintendo' })).toHaveAttribute('href', '/juegos/nintendo')
  })

  it('al elegir una plataforma cierra el dropdown y llama a onNavigate', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()
    renderDropdown({ onNavigate })

    await user.click(screen.getByRole('button', { name: 'Juegos' }))
    await user.click(screen.getByRole('menuitem', { name: 'PC' }))

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('cierra con Escape y al hacer click fuera', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <div>
          <PlataformasDropdown />
          <button type="button">fuera</button>
        </div>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Juegos' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Juegos' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.click(screen.getByText('fuera'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
