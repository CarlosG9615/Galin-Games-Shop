// Iconos decorativos en línea (sin librería externa) para las opciones del dropdown
// de plataformas, mismo patrón que NavbarIconos.jsx: aria-hidden y color heredado del
// tema activo vía currentColor (el texto de cada <Link role="menuitem"> ya aporta el
// nombre accesible de la opción).

export function IconoPC() {
  return (
    <svg className="navbar__icono" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="13" rx="1.5" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

export function IconoPlayStation() {
  return (
    <svg className="navbar__icono" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 18c3-9 4-12 5-13.5" />
      <path d="M20 18c-3-9-4-12-5-13.5" />
      <circle cx="9" cy="13" r="1" />
      <circle cx="15" cy="13" r="1" />
    </svg>
  )
}

export function IconoXbox() {
  return (
    <svg className="navbar__icono" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M5.5 5.5l6.5 6.5 6.5-6.5" />
      <path d="M5.5 18.5c2-4 4-6 6.5-6s4.5 2 6.5 6" />
    </svg>
  )
}

export function IconoNintendo() {
  return (
    <svg className="navbar__icono" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="2" width="6" height="20" rx="2.5" />
      <rect x="13" y="2" width="6" height="20" rx="2.5" />
      <circle cx="16" cy="7" r="1" />
      <circle cx="8" cy="17" r="1.6" />
    </svg>
  )
}
