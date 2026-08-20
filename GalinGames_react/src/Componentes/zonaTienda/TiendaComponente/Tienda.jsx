import { useAuth } from '../../../hooks/useAuth'

function Tienda() {
  const { user, logout } = useAuth()

  return (
    <div style={{ minHeight: '100vh', width: '100vw', position: 'relative' }}>
      <div className="fondo-gaming" style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh' }} />
      <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10, textAlign: 'center' }}>
        <h1 className="videojuego-title">Bienvenido, {user?.username}</h1>
        <p className="videojuego-text">La tienda de GalinGames está en construcción.</p>
        <button type="button" className="btn btn-primary botonRegistro" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default Tienda
