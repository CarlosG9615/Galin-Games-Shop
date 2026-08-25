import { useTranslation } from 'react-i18next'
import { useTheme } from '../../../hooks/useTheme'
import './HeroSection.scss'

function HeroSection() {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const mandoSrc = theme === 'azul' ? '/mando.png' : '/mando2.png'

  return (
    <section className="hero" style={{ '--hero-imagen-mando': `url(${mandoSrc})` }}>
      <div className="hero__contenido">
        <h1 className="hero__titulo">{t('hero.title')}</h1>
        <p className="hero__texto">{t('hero.discoverSubtitle')}</p>
        <span className="hero__boton" aria-disabled="true">{t('hero.ctaViewAll')}</span>
      </div>
      <div className="hero__imagen-mando" aria-hidden="true" />
    </section>
  )
}

export default HeroSection
