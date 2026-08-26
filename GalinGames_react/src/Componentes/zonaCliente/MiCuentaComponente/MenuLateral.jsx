import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './MenuLateral.scss'

const ITEMS = [
  { seccion: 'perfil', labelKey: 'miCuenta.menu.perfil' },
  { seccion: 'direcciones', labelKey: 'miCuenta.menu.direcciones' },
  { seccion: 'pedidos', labelKey: 'miCuenta.menu.pedidos' },
]

// Resalta la sección activa con el color de acento del tema (Requisito 2.4); el color
// en sí vive en MenuLateral.scss vía var(--color-acento), nunca hardcodeado aquí.
function MenuLateral({ seccionActiva }) {
  const { t } = useTranslation()

  return (
    <nav className="menu-lateral" aria-label={t('miCuenta.menu.ariaLabel')}>
      <ul>
        {ITEMS.map(({ seccion, labelKey }) => (
          <li key={seccion}>
            <Link
              to={`/mi-cuenta/${seccion}`}
              className={`menu-lateral__item${seccion === seccionActiva ? ' menu-lateral__item--activo' : ''}`}
              aria-current={seccion === seccionActiva ? 'page' : undefined}
            >
              {t(labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default MenuLateral
