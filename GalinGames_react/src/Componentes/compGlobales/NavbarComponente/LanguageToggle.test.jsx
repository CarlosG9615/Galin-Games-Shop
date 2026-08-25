import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../../../globalState/languageContext'
import LanguageToggle from './LanguageToggle'

function renderLanguageToggle() {
  return render(
    <LanguageProvider>
      <LanguageToggle />
    </LanguageProvider>,
  )
}

describe('LanguageToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('lang')
  })

  it('empieza mostrando "ES" con el dropdown cerrado', () => {
    renderLanguageToggle()

    const boton = screen.getByRole('button', { name: 'Cambiar idioma' })
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    expect(boton).toHaveTextContent('ES')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('al hacer click abre el dropdown con "Español" deshabilitado y "Inglés" seleccionable', async () => {
    const user = userEvent.setup()
    renderLanguageToggle()

    await user.click(screen.getByRole('button', { name: 'Cambiar idioma' }))

    expect(screen.getByRole('button', { name: 'Cambiar idioma' })).toHaveAttribute('aria-expanded', 'true')
    const opcionEs = screen.getByRole('menuitem', { name: 'Español' })
    const opcionEn = screen.getByRole('menuitem', { name: 'Inglés' })
    expect(opcionEs).toBeDisabled()
    expect(opcionEs).toHaveAttribute('aria-disabled', 'true')
    expect(opcionEn).not.toBeDisabled()
  })

  it('al seleccionar "Inglés" cambia el idioma activo, el lang del html, y cierra el dropdown', async () => {
    const user = userEvent.setup()
    renderLanguageToggle()

    // Referencia capturada antes del cambio: el propio aria-label se traduce al
    // cambiar de idioma, así que no sirve para volver a localizar el botón después.
    const boton = screen.getByRole('button', { name: 'Cambiar idioma' })
    await user.click(boton)
    await user.click(screen.getByRole('menuitem', { name: 'Inglés' }))

    expect(boton).toHaveTextContent('EN')
    expect(boton).toHaveAttribute('aria-label', 'Change language')
    expect(document.documentElement.getAttribute('lang')).toBe('en')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('es activable con teclado (Enter) y cierra con Escape', async () => {
    const user = userEvent.setup()
    renderLanguageToggle()

    const boton = screen.getByRole('button', { name: 'Cambiar idioma' })
    boton.focus()
    await user.keyboard('{Enter}')

    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('cierra el dropdown al hacer click fuera', async () => {
    const user = userEvent.setup()
    render(
      <LanguageProvider>
        <div>
          <LanguageToggle />
          <button type="button">fuera</button>
        </div>
      </LanguageProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Cambiar idioma' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.click(screen.getByText('fuera'))

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
