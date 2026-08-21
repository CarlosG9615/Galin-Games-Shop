import { useTheme } from '../../../hooks/useTheme'
import './ThemeToggle.scss'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const esRojo = theme === 'rojo'
  const logoSrc = theme === 'azul' ? '/logo1.png' : '/logo2.png'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-pressed={esRojo}
      aria-label={`Cambiar a tema ${esRojo ? 'azul' : 'rojo'}`}
      title={`Tema actual: ${theme}`}
    >
      <img className="theme-toggle__logo" src={logoSrc} alt="GG Games" />
    </button>
  )
}

export default ThemeToggle
