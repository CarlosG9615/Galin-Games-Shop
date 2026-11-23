import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IconoPC, IconoPlayStation, IconoXbox, IconoNintendo } from './PlataformasIconos'
import './PlataformasDropdown.scss'

const PLATAFORMAS = [
  { slug: 'pc', clave: 'juegos.dropdown.pc' },
  { slug: 'playstation', clave: 'juegos.dropdown.playstation' },
  { slug: 'xbox', clave: 'juegos.dropdown.xbox' },
  { slug: 'nintendo', clave: 'juegos.dropdown.nintendo' },
]

// Búsqueda por slug en vez de guardar el componente-icono directamente en
// PLATAFORMAS: un componente destructurado de un parámetro de `.map()` y usado
// solo como <Icono /> no cuenta como "uso" para `no-unused-vars` en este eslint.config.js
// (sin eslint-plugin-react), así que se resuelve como `const` local dentro del `.map()`.
const ICONOS_POR_SLUG = { pc: IconoPC, playstation: IconoPlayStation, xbox: IconoXbox, nintendo: IconoNintendo }

// `onNavigate` (opcional): Navbar.jsx lo usa para cerrar también su propio menú móvil
// al elegir una plataforma, además de que este dropdown cierre el suyo.
function PlataformasDropdown({ onNavigate }) {
  const { t } = useTranslation()
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

  const handleSeleccionar = () => {
    setAbierto(false)
    onNavigate?.()
  }

  return (
    <div className="plataformas-dropdown" ref={contenedorRef}>
      <button
        type="button"
        className="navbar__link plataformas-dropdown__boton"
        aria-haspopup="true"
        aria-expanded={abierto}
        onClick={() => setAbierto((prev) => !prev)}
      >
        {t('navbar.linkJuegos')}
      </button>
      {abierto && (
        <ul className="plataformas-dropdown__menu" role="menu" aria-label={t('juegos.dropdown.menuLabel')}>
          {PLATAFORMAS.map(({ slug, clave }) => {
            const Icono = ICONOS_POR_SLUG[slug]
            return (
              <li key={slug} role="none">
                <Link
                  to={`/juegos/${slug}`}
                  role="menuitem"
                  className="plataformas-dropdown__opcion"
                  onClick={handleSeleccionar}
                >
                  <Icono />
                  {t(clave)}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default PlataformasDropdown
