import { useState } from 'react'
import './GameCard.scss'

function GameCard({ src, alt }) {
  const [error, setError] = useState(false)

  return (
    <div className="game-card">
      {error ? (
        <div className="game-card__fallback" role="img" aria-label={alt}>
          {alt}
        </div>
      ) : (
        <img
          className="game-card__imagen"
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setError(true)}
        />
      )}
    </div>
  )
}

export default GameCard
