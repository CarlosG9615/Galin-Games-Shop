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
    >
      <img className={`theme-toggle__logo theme-toggle__logo--${theme}`} src={logoSrc} alt="GG Games" />
    </button>
  )
}

export default ThemeToggle
