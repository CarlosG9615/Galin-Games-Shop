import { useTranslation } from 'react-i18next'
import { useTheme } from '../../../hooks/useTheme'
import './ThemeToggle.scss'

function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const esRojo = theme === 'rojo'
  const logoSrc = theme === 'azul' ? '/logo1.png' : '/logo2.png'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-pressed={esRojo}
      aria-label={esRojo ? t('themeToggle.ariaLabelToBlue') : t('themeToggle.ariaLabelToRed')}
    >
      <img className={`theme-toggle__logo theme-toggle__logo--${theme}`} src={logoSrc} alt={t('themeToggle.logoAlt')} />
    </button>
  )
}

export default ThemeToggle
