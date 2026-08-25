import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../../hooks/useLanguage'
import { IconoGlobo } from './NavbarIconos'
import './LanguageToggle.scss'

function LanguageToggle() {
  const { t } = useTranslation()
  const { language, changeLanguage } = useLanguage()
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef(null)

  useEffect(() => {
    if (!abierto) return undefined

    const handleClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false)
      }
    }
    const handleTecla = (e) => {
      if (e.key === 'Escape') setAbierto(false)
    }

    document.addEventListener('mousedown', handleClickFuera)
    document.addEventListener('keydown', handleTecla)
    return () => {
      document.removeEventListener('mousedown', handleClickFuera)
      document.removeEventListener('keydown', handleTecla)
    }
  }, [abierto])

  const handleSeleccionar = (idioma) => {
    changeLanguage(idioma)
    setAbierto(false)
  }

  return (
    <div className="language-toggle" ref={contenedorRef}>
      <button
        type="button"
        className="language-toggle__boton"
        aria-haspopup="true"
        aria-expanded={abierto}
        aria-label={t('languageToggle.ariaLabel')}
        onClick={() => setAbierto((prev) => !prev)}
      >
        <IconoGlobo />
        <span>{language.toUpperCase()}</span>
      </button>
      {abierto && (
        <ul className="language-toggle__dropdown" role="menu" aria-label={t('languageToggle.menuLabel')}>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="language-toggle__opcion"
              aria-disabled={language === 'es'}
              disabled={language === 'es'}
              onClick={() => handleSeleccionar('es')}
            >
              {t('languageToggle.spanish')}
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="language-toggle__opcion"
              aria-disabled={language === 'en'}
              disabled={language === 'en'}
              onClick={() => handleSeleccionar('en')}
            >
              {t('languageToggle.english')}
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}

export default LanguageToggle
