import { Link } from 'react-router-dom'
import './Breadcrumb.scss'

// Genérico: no conoce el dominio del sitio, solo pinta la lista de `items` que
// le pasa la página que lo usa (label ya traducido + `to` opcional). El último
// item es la página actual (aria-current="page"), sin enlace; un item intermedio
// sin `to` se pinta como texto plano, sin marcarlo como la página actual.
function Breadcrumb({ items, ariaLabel }) {
  return (
    <nav className="breadcrumb" aria-label={ariaLabel}>
      <ol className="breadcrumb__lista">
        {items.map((item, index) => {
          const esActual = index === items.length - 1
          return (
            <li key={item.label} className="breadcrumb__item">
              {esActual ? (
                <span className="breadcrumb__actual" aria-current="page">{item.label}</span>
              ) : item.to ? (
                <Link to={item.to} className="breadcrumb__link">{item.label}</Link>
              ) : (
                <span className="breadcrumb__texto">{item.label}</span>
              )}
              {!esActual && <span className="breadcrumb__separador" aria-hidden="true">›</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb
