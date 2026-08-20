import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Login from '../Componentes/zonaCliente/LoginComponente/Login'
import Registro from '../Componentes/zonaCliente/RegistroComponente/Registro'
import Tienda from '../Componentes/zonaTienda/TiendaComponente/Tienda'
import ErrorPage from '../Componentes/compGlobales/ErrorPageComponente/ErrorPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

function AppRouter() {
  const { initializing } = useAuth()

  if (initializing) {
    return <div className="loading-screen">Cargando...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Tienda />
          </ProtectedRoute>
        }
      />
      <Route path="/error/:code" element={<ErrorPage />} />
      <Route path="*" element={<ErrorPage code={404} />} />
    </Routes>
  )
}

export default AppRouter
