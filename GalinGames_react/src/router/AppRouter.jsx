import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import PrivateRoute from './PrivateRoute'
import Login from '../Componentes/zonaCliente/LoginComponente/Login'
import Registro from '../Componentes/zonaCliente/RegistroComponente/Registro'
import Home from '../Componentes/zonaHome/HomeComponente/Home'
import ErrorPage from '../Componentes/compGlobales/ErrorPageComponente/ErrorPage'
import MiCuenta from '../Componentes/zonaCliente/MiCuentaComponente/MiCuenta'

function AppRouter() {
  const { t } = useTranslation()
  const { initializing } = useAuth()

  if (initializing) {
    return <div className="loading-screen">{t('common.loading')}</div>
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/" element={<Home />} />
      <Route path="/mi-cuenta" element={<Navigate to="/mi-cuenta/perfil" replace />} />
      <Route
        path="/mi-cuenta/:seccion"
        element={
          <PrivateRoute>
            <MiCuenta />
          </PrivateRoute>
        }
      />
      <Route path="/error/:code" element={<ErrorPage />} />
      <Route path="*" element={<ErrorPage code={404} />} />
    </Routes>
  )
}

export default AppRouter
