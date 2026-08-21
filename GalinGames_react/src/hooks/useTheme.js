import { useContext } from 'react'
import { ThemeContext } from '../globalState/themeContext'

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return ctx
}
