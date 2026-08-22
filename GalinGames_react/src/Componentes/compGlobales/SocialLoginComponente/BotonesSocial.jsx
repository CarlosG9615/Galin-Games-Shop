import { IconoFacebook, IconoGoogle, IconoApple, IconoDiscord } from './SocialIconos'

// Fila de accesos sociales + separador "o", reutilizada tal cual por Login.jsx y
// Registro.jsx (Requisitos 7bis, 7ter) — sin backend de OAuth todavía, así que cada
// botón es puramente decorativo (mismo patrón "próximamente" que el carrito del
// Navbar): un <span aria-disabled="true">, no un <button>/<a> navegable.
const PROVEEDORES = [
  { nombre: 'Facebook', Icono: IconoFacebook, clase: 'facebook' },
  { nombre: 'Google', Icono: IconoGoogle, clase: 'google' },
  { nombre: 'Apple', Icono: IconoApple, clase: 'apple' },
  { nombre: 'Discord', Icono: IconoDiscord, clase: 'discord' },
]

function BotonesSocial() {
  return (
    <>
      <div className="pagina-dividida__social">
        {PROVEEDORES.map((proveedor) => {
          const IconoProveedor = proveedor.Icono
          return (
            <span
              key={proveedor.nombre}
              className={`pagina-dividida__social-boton pagina-dividida__social-boton--${proveedor.clase}`}
              aria-disabled="true"
              title={`Continuar con ${proveedor.nombre} (próximamente)`}
            >
              <IconoProveedor />
            </span>
          )
        })}
      </div>
      <div className="pagina-dividida__divisor">
        <span>o</span>
      </div>
    </>
  )
}

export default BotonesSocial
