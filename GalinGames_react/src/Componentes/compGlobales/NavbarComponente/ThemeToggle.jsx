import { useTheme } from '../../../hooks/useTheme'
import './ThemeToggle.scss'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const esRojo = theme === 'rojo'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-pressed={esRojo}
      aria-label={`Cambiar a tema ${esRojo ? 'azul' : 'rojo'}`}
      title={`Tema actual: ${theme}`}
    >
      <span className="theme-toggle__pista">
        <span className="theme-toggle__pulgar" />
      </span>
    </button>
  )
}

export default ThemeToggle
