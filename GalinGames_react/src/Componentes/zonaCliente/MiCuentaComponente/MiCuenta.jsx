import { useParams, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../compGlobales/NavbarComponente/Navbar'
import MenuLateral from './MenuLateral'
import PerfilPanel from './PerfilPanel'
import EmailPasswordPanel from './EmailPasswordPanel'
import DireccionesPanel from './DireccionesPanel'
import PedidosPanel from './PedidosPanel'
import './MiCuenta.scss'

const SECCIONES_VALIDAS = ['perfil', 'direcciones', 'pedidos']

// Layout de la Vista Mi Cuenta (Requisito 2): menú lateral + divisor + panel de
// contenido. El Navbar genérico se sigue mostrando (Requisito 1.3), mismo patrón que
// Home.jsx: cada página que lo necesita lo importa, no hay layout global.
function MiCuenta() {
  const { seccion } = useParams()
  const { t } = useTranslation()

  if (!SECCIONES_VALIDAS.includes(seccion)) {
    return <Navigate to="/mi-cuenta/perfil" replace />
  }

  return (
    <>
      <Navbar />
      <main className="mi-cuenta pagina-tematica">
        <div className="mi-cuenta__contenedor">
          <MenuLateral seccionActiva={seccion} />
          <div className="mi-cuenta__divisor" aria-hidden="true" />
          <div className="mi-cuenta__panel">
            {seccion === 'perfil' && (
              <>
                <h1 className="titulo-tema mi-cuenta__titulo">{t('miCuenta.menu.perfil')}</h1>
                <PerfilPanel />
                <EmailPasswordPanel />
              </>
            )}
            {seccion === 'direcciones' && (
              <>
                <h1 className="titulo-tema mi-cuenta__titulo">{t('miCuenta.menu.direcciones')}</h1>
                <DireccionesPanel />
              </>
            )}
            {seccion === 'pedidos' && (
              <>
                <h1 className="titulo-tema mi-cuenta__titulo">{t('miCuenta.menu.pedidos')}</h1>
                <PedidosPanel />
              </>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

export default MiCuenta
