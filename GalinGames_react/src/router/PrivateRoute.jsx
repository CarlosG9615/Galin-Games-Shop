import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// AppRouter ya muestra la pantalla de carga global mientras `initializing` es true
// (antes de montar <Routes>), así que aquí solo hace falta decidir entre el
// contenido protegido y la redirección a /login (Requisito 1.4).
function PrivateRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth()

  if (initializing) return null

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default PrivateRoute
