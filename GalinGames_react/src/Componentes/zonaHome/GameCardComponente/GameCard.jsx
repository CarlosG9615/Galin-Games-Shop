import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../hooks/useLanguage'
import './GameCard.scss'

function soportaHoverConRaton() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

function GameCard({ id, imagenPortada, nombre, plataforma, precio, videoPreviewUrl }) {
  const { language } = useLanguage()
  const [error, setError] = useState(false)
  const [hover, setHover] = useState(false)

  const precioFormateado = new Intl.NumberFormat(language === 'en' ? 'en-US' : 'es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(precio)

  const mostrarVideo = hover && Boolean(videoPreviewUrl)

  return (
    <Link
      to={`/juegos/detalle/${id}?plataforma=${encodeURIComponent(plataforma)}`}
      className="game-card"
      onMouseEnter={() => { if (soportaHoverConRaton()) setHover(true) }}
      onMouseLeave={() => setHover(false)}
    >
      <div className="game-card__media">
        {error ? (
          <div className="game-card__fallback" role="img" aria-label={nombre}>
            {nombre}
          </div>
        ) : mostrarVideo ? (
          <video className="game-card__video" src={videoPreviewUrl} autoPlay loop muted playsInline />
        ) : (
          <img
            className="game-card__imagen"
            src={imagenPortada}
            alt={nombre}
            loading="lazy"
            onError={() => setError(true)}
          />
        )}
      </div>
      <div className="game-card__info">
        <p className="game-card__texto">{`${nombre} - ${plataforma}`}</p>
        <p className="game-card__precio">{precioFormateado}</p>
      </div>
    </Link>
  )
}

export default GameCard
