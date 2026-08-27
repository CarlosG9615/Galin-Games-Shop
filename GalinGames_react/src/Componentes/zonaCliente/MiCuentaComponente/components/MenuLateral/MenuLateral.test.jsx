import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MenuLateral from './MenuLateral'

function renderMenu(seccionActiva) {
  return render(
    <MemoryRouter>
      <MenuLateral seccionActiva={seccionActiva} />
    </MemoryRouter>,
  )
}

describe('MenuLateral', () => {
  it('renderiza los cuatro enlaces de sección', () => {
    renderMenu('perfil')
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toHaveAttribute('href', '/mi-cuenta/perfil')
    expect(screen.getByRole('link', { name: 'Email y contraseña' })).toHaveAttribute('href', '/mi-cuenta/email-password')
    expect(screen.getByRole('link', { name: 'Direcciones' })).toHaveAttribute('href', '/mi-cuenta/direcciones')
    expect(screen.getByRole('link', { name: 'Mis pedidos' })).toHaveAttribute('href', '/mi-cuenta/pedidos')
  })

  it('marca como activa (aria-current) la sección indicada', () => {
    renderMenu('direcciones')
    expect(screen.getByRole('link', { name: 'Direcciones' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Mi perfil' })).not.toHaveAttribute('aria-current')
  })
})
