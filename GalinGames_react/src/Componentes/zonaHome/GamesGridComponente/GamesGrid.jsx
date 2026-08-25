import { useTranslation } from 'react-i18next'
import GameCard from '../GameCardComponente/GameCard'
import './GamesGrid.scss'

const JUEGOS = [
  { src: '/assassins.jpg', alt: "Assassin's Creed Black Flag Resynced" },
  { src: '/blooddownwalker.jpg', alt: 'Blood Down Walker' },
  { src: '/dragonball.jpg', alt: 'Dragon Ball' },
  { src: '/fc27.jpg', alt: 'FC 27' },
  { src: '/gta.jpg', alt: 'GTA' },
  { src: '/wolverine.jpg', alt: "Marvel's Wolverine" },
]

function GamesGrid() {
  const { t } = useTranslation()

  return (
    <section className="games-grid" aria-labelledby="games-grid-titulo">
      <h2 id="games-grid-titulo" className="games-grid__titulo">{t('gamesGrid.title')}</h2>
      <div className="games-grid__lista">
        {JUEGOS.map(({ src, alt }) => (
          <GameCard key={src} src={src} alt={alt} />
        ))}
      </div>
    </section>
  )
}

export default GamesGrid
