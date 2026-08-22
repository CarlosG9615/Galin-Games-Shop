import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import ThemeToggle from './ThemeToggle'
import { IconoBusqueda, IconoGlobo, IconoUsuario, IconoCarrito } from './NavbarIconos'
import './Navbar.scss'

const ENLACES_PROXIMAMENTE = ['Juegos', 'Novedades', 'Comunidad']

function Navbar() {
  const { isAuthenticated, logout } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [categoriasAbiertas, setCategoriasAbiertas] = useState(false)
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false)
  const menuUsuarioRef = useRef(null)

  const cerrarMenu = () => {
    setMenuAbierto(false)
    setCategoriasAbiertas(false)
    setMenuUsuarioAbierto(false)
  }

  useEffect(() => {
    if (!menuUsuarioAbierto) return undefined

    const handleClickFuera = (e) => {
      if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(e.target)) {
        setMenuUsuarioAbierto(false)
      }
    }
    const handleTecla = (e) => {
      if (e.key === 'Escape') setMenuUsuarioAbierto(false)
    }

    document.addEventListener('mousedown', handleClickFuera)
    document.addEventListener('keydown', handleTecla)
    return () => {
      document.removeEventListener('mousedown', handleClickFuera)
      document.removeEventListener('keydown', handleTecla)
    }
  }, [menuUsuarioAbierto])

  const handleCerrarSesion = () => {
    setMenuUsuarioAbierto(false)
    logout()
  }

  return (
    <header className="navbar">
      <nav className="navbar__nav" aria-label="Navegación principal">
        <ThemeToggle />

        {/* Solo visible en el tramo intermedio de anchos (ver Navbar.scss): sustituye
            a los enlaces de categorías por el icono de tres líneas, centrado, para que
            quepan el logo grande y la zona de sesión sin cortarse. */}
        <button
          type="button"
          className="navbar__toggle-categorias"
          aria-expanded={categoriasAbiertas}
          aria-controls="navbar-categorias"
          aria-label={categoriasAbiertas ? 'Cerrar categorías' : 'Abrir categorías'}
          onClick={() => setCategoriasAbiertas((prev) => !prev)}
        >
          <span className="navbar__toggle-barra" />
          <span className="navbar__toggle-barra" />
          <span className="navbar__toggle-barra" />
        </button>

        <button
          type="button"
          className="navbar__toggle-menu"
          aria-expanded={menuAbierto}
          aria-controls="navbar-menu-movil"
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuAbierto((prev) => !prev)}
        >
          <span className="navbar__toggle-barra" />
          <span className="navbar__toggle-barra" />
          <span className="navbar__toggle-barra" />
        </button>

        <div id="navbar-menu-movil" className={`navbar__menu-movil ${menuAbierto ? 'navbar__menu-movil--abierto' : ''}`}>
          <ul id="navbar-categorias" className={`navbar__enlaces ${categoriasAbiertas ? 'navbar__enlaces--desplegado' : ''}`}>
            <li>
              <Link to="/" className="navbar__link" onClick={cerrarMenu}>Inicio</Link>
            </li>
            {ENLACES_PROXIMAMENTE.map((texto) => (
              <li key={texto}>
                <span className="navbar__link navbar__link--proximamente" aria-disabled="true">{texto}</span>
              </li>
            ))}
          </ul>

          <div className="navbar__acciones">
            <div className="navbar__utilidades">
              <span className="navbar__icono-utilidad" aria-disabled="true" title="Búsqueda (próximamente)">
                <IconoBusqueda />
              </span>
              <span className="navbar__idioma" aria-disabled="true" title="Idioma (próximamente)">
                <IconoGlobo />
                ES
              </span>
            </div>

            <span className="navbar__divisor" aria-hidden="true" />

            <div className="navbar__sesion">
              <span className="navbar__icono-carrito" aria-disabled="true" title="Carrito (próximamente)">
                <IconoCarrito />
              </span>
              {isAuthenticated ? (
                <div className="navbar__menu-usuario" ref={menuUsuarioRef}>
                  <button
                    type="button"
                    className="navbar__icono-usuario"
                    aria-haspopup="true"
                    aria-expanded={menuUsuarioAbierto}
                    aria-label="Menú de usuario"
                    onClick={() => setMenuUsuarioAbierto((prev) => !prev)}
                  >
                    <IconoUsuario />
                  </button>
                  {menuUsuarioAbierto && (
                    <ul className="navbar__dropdown">
                      <li><span className="navbar__dropdown-link" aria-disabled="true">Soporte</span></li>
                      <li><span className="navbar__dropdown-link" aria-disabled="true">Mi cuenta</span></li>
                      <li><span className="navbar__dropdown-link" aria-disabled="true">Mis pedidos</span></li>
                      <li>
                        <button type="button" className="navbar__dropdown-link" onClick={handleCerrarSesion}>
                          Cerrar sesión
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              ) : (
                <Link to="/login" className="navbar__icono-usuario" onClick={cerrarMenu} aria-label="Iniciar sesión">
                  <IconoUsuario />
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
