import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { useContext } from 'react'
import { LanguageContext, LanguageProvider } from './languageContext'

function Probe() {
  const ctx = useContext(LanguageContext)
  return (
    <div>
      <span data-testid="language">{ctx.language}</span>
      <button onClick={() => ctx.changeLanguage('en')}>a-en</button>
      <button onClick={() => ctx.changeLanguage('es')}>a-es</button>
      <button onClick={() => ctx.changeLanguage('fr')}>a-fr</button>
    </div>
  )
}

describe('LanguageProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('lang')
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('lang')
  })

  it('aplica el idioma español por defecto cuando no hay nada en localStorage', () => {
    render(<LanguageProvider><Probe /></LanguageProvider>)

    expect(screen.getByTestId('language').textContent).toBe('es')
    expect(document.documentElement.getAttribute('lang')).toBe('es')
  })

  it('aplica el idioma guardado en localStorage al montar', () => {
    localStorage.setItem('gg-language', 'en')

    render(<LanguageProvider><Probe /></LanguageProvider>)

    expect(screen.getByTestId('language').textContent).toBe('en')
    expect(document.documentElement.getAttribute('lang')).toBe('en')
  })

  it('usa español por defecto si el valor guardado no es "es" ni "en"', () => {
    localStorage.setItem('gg-language', 'fr')

    render(<LanguageProvider><Probe /></LanguageProvider>)

    expect(screen.getByTestId('language').textContent).toBe('es')
  })

  it('changeLanguage cambia el idioma, actualiza lang del html y lo persiste en localStorage', () => {
    render(<LanguageProvider><Probe /></LanguageProvider>)

    act(() => {
      screen.getByText('a-en').click()
    })

    expect(screen.getByTestId('language').textContent).toBe('en')
    expect(localStorage.getItem('gg-language')).toBe('en')
    expect(document.documentElement.getAttribute('lang')).toBe('en')

    act(() => {
      screen.getByText('a-es').click()
    })

    expect(screen.getByTestId('language').textContent).toBe('es')
    expect(localStorage.getItem('gg-language')).toBe('es')
  })

  it('ignora un idioma no válido pasado a changeLanguage', () => {
    render(<LanguageProvider><Probe /></LanguageProvider>)

    act(() => {
      screen.getByText('a-fr').click()
    })

    expect(screen.getByTestId('language').textContent).toBe('es')
    expect(localStorage.getItem('gg-language')).toBeNull()
  })

  it('cambiar de idioma no toca el tema guardado en localStorage', () => {
    localStorage.setItem('gg-theme', 'rojo')

    render(<LanguageProvider><Probe /></LanguageProvider>)

    act(() => {
      screen.getByText('a-en').click()
    })

    expect(localStorage.getItem('gg-theme')).toBe('rojo')
  })
})
