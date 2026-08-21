import { createContext, useState, useCallback, useLayoutEffect } from 'react'

// eslint-disable-next-line react-refresh/only-export-components -- ThemeContext y ThemeProvider viven juntos por diseño (ver design.md de home-diseno)
export const ThemeContext = createContext(null)

const THEME_STORAGE_KEY = 'gg-theme'
const TEMAS_VALIDOS = ['azul', 'rojo']

function readThemeFromStorage() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return TEMAS_VALIDOS.includes(stored) ? stored : 'azul'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readThemeFromStorage)

  // useLayoutEffect (no useEffect): aplica data-theme al <html> antes del primer
  // pintado del navegador, evitando el parpadeo de un tema a otro (Requisito 2.2).
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'azul' ? 'rojo' : 'azul'
      localStorage.setItem(THEME_STORAGE_KEY, next)
      return next
    })
  }, [])

  const value = { theme, toggleTheme }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
