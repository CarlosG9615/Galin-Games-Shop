import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import ThemeToggle from './ThemeToggle'
import './Navbar.scss'

const ENLACES_PROXIMAMENTE = ['Juegos', 'Novedades', 'Comunidad']

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const cerrarMenu = () => setMenuAbierto(false)

  return (
    <header className="navbar">
      <nav className="navbar__nav" aria-label="Navegación principal">
        <ThemeToggle />

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
          <ul className="navbar__enlaces">
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
            {isAuthenticated ? (
              <div className="navbar__sesion">
                <span className="navbar__usuario">{user?.username}</span>
                <button type="button" className="navbar__cerrar-sesion" onClick={logout}>
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="navbar__sesion">
                <Link to="/login" className="navbar__link" onClick={cerrarMenu}>Iniciar sesión</Link>
                <Link to="/registro" className="boton-primario navbar__boton-registro" onClick={cerrarMenu}>
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
