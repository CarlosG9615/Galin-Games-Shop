import { createContext, useState, useCallback, useLayoutEffect } from 'react'
import i18n from '../i18n'

// eslint-disable-next-line react-refresh/only-export-components -- LanguageContext y LanguageProvider viven juntos, mismo patrón que themeContext.jsx
export const LanguageContext = createContext(null)

const LANGUAGE_STORAGE_KEY = 'gg-language'
const IDIOMAS_VALIDOS = ['es', 'en']

function readLanguageFromStorage() {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return IDIOMAS_VALIDOS.includes(stored) ? stored : 'es'
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(readLanguageFromStorage)

  // useLayoutEffect (no useEffect): aplica lang al <html> y sincroniza i18next antes
  // del primer pintado, igual que ThemeProvider hace con data-theme.
  useLayoutEffect(() => {
    document.documentElement.setAttribute('lang', language)
    i18n.changeLanguage(language)
  }, [language])

  const changeLanguage = useCallback((next) => {
    if (!IDIOMAS_VALIDOS.includes(next)) return
    setLanguage(next)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
  }, [])

  const value = { language, changeLanguage }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
