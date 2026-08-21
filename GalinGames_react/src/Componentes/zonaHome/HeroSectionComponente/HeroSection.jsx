import { useTheme } from '../../../hooks/useTheme'
import './HeroSection.scss'

function HeroSection() {
  const { theme } = useTheme()
  const mandoSrc = theme === 'azul' ? '/mando.png' : '/mando2.png'

  return (
    <section className="hero" style={{ '--hero-imagen-mando': `url(${mandoSrc})` }}>
      <div className="hero__contenido">
        <span className="hero__etiqueta">TENDENCIAS</span>
        <h1 className="hero__titulo">LO MÁS JUGADO</h1>
        <p className="hero__texto">Descubre lo que la comunidad está jugando ahora mismo.</p>
        <span className="hero__boton" aria-disabled="true">Ver todos ›</span>
      </div>
      <div className="hero__imagen-mando" aria-hidden="true" />
    </section>
  )
}

export default HeroSection
