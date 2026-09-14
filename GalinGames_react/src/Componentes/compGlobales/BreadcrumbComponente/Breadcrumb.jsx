import { Link } from 'react-router-dom'

// Genérico: no conoce el dominio del sitio, solo pinta la lista de `items` que
// le pasa la página que lo usa (label ya traducido + `to` opcional). El último
// item se pinta como la página actual, sin enlace.
function Breadcrumb({ items, ariaLabel }) {
  return (
    <nav className="breadcrumb" aria-label={ariaLabel}>
      <ol className="breadcrumb__lista">
        {items.map((item, index) => {
          const esActual = index === items.length - 1
          return (
            <li key={item.label} className="breadcrumb__item">
              {!esActual && item.to ? (
                <Link to={item.to} className="breadcrumb__link">{item.label}</Link>
              ) : (
                <span className="breadcrumb__actual" aria-current="page">{item.label}</span>
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
