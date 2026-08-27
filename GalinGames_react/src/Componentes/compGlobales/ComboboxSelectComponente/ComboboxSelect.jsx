import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import './ComboboxSelect.scss'

const ALTURA_LISTA_PX = 240 // 15rem, tope "deseado" — se recorta si el viewport no tiene sitio
const ALTURA_MINIMA_PX = 120
const MARGEN_VIEWPORT_PX = 8

// Combobox propio (patrón ARIA "select-only combobox": foco se queda en el botón,
// aria-activedescendant marca la opción resaltada) en vez de un <select> nativo — un
// <select> nativo no permite estilar el popup de opciones cuando está abierto (lo
// pinta el sistema operativo), así que aquí SÍ controlamos ese fondo con CSS normal.
// Genérico: no genera las `options` ([{code, nombre}]), solo las pinta — quien lo usa
// decide de dónde salen (i18n-iso-countries para Nacionalidad/País, country-region-data
// para Provincia, etc.), ver PerfilPanel.jsx y FormularioDireccion.jsx.
//
// La lista se porta a document.body con position:fixed calculado desde
// getBoundingClientRect() del botón (no position:absolute normal dentro del propio
// componente): así no queda nunca recortada por el overflow de un antecesor ni
// desincronizada del botón al hacer scroll de la página, y su alto máximo se ajusta
// al hueco real del viewport en vez de un valor fijo que podía no caber. Siempre se
// abre hacia abajo (nunca "flip" hacia arriba) — el padding-bottom del contenedor que
// lo usa debe dejar hueco de scroll real debajo (ver MiCuenta.scss).
function ComboboxSelect({ id, value, onChange, options, disabled, placeholder }) {
  const [abierto, setAbierto] = useState(false)
  const [indiceActivo, setIndiceActivo] = useState(-1)
  const [posicion, setPosicion] = useState(null)
  const raizRef = useRef(null)
  const botonRef = useRef(null)
  const listaRef = useRef(null)
  const typeaheadRef = useRef({ texto: '', timeoutId: null })

  const seleccionado = options.find((o) => o.code === value) || null

  const calcularPosicion = useCallback(() => {
    if (!botonRef.current) return
    const rect = botonRef.current.getBoundingClientRect()
    const espacioAbajo = window.innerHeight - rect.bottom - MARGEN_VIEWPORT_PX

    setPosicion({
      left: rect.left,
      width: rect.width,
      top: rect.bottom + 4,
      maxHeight: Math.max(ALTURA_MINIMA_PX, Math.min(ALTURA_LISTA_PX, espacioAbajo)),
    })
  }, [])

  useEffect(() => {
    if (!abierto) return

    function handleClickFuera(e) {
      if (raizRef.current && !raizRef.current.contains(e.target) && !listaRef.current?.contains(e.target)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    calcularPosicion()

    // capture:true — hace falta para enterarse también del scroll de un ancestro con
    // su propio overflow (no solo window).
    window.addEventListener('scroll', calcularPosicion, true)
    window.addEventListener('resize', calcularPosicion)
    return () => {
      window.removeEventListener('scroll', calcularPosicion, true)
      window.removeEventListener('resize', calcularPosicion)
    }
  }, [abierto, calcularPosicion])

  useEffect(() => {
    if (!abierto) return
    const idx = options.findIndex((o) => o.code === value)
    setIndiceActivo(idx >= 0 ? idx : 0)
  }, [abierto]) // eslint-disable-line react-hooks/exhaustive-deps -- solo al abrir

  useEffect(() => {
    if (!abierto || indiceActivo < 0 || !listaRef.current) return
    listaRef.current.children[indiceActivo]?.scrollIntoView?.({ block: 'nearest' })
  }, [abierto, indiceActivo])

  const cerrar = () => setAbierto(false)

  const elegir = (code) => {
    onChange(code)
    cerrar()
    botonRef.current?.focus()
  }

  // Salta a la primera opción cuyo nombre empiece por lo escrito, igual que el
  // comportamiento nativo de un <select> al teclear — con listas largas (~250 países)
  // no hay hueco para escanearlas a ojo.
  const buscarPorTecleo = (letra) => {
    const ref = typeaheadRef.current
    clearTimeout(ref.timeoutId)
    ref.texto += letra.toLowerCase()
    ref.timeoutId = setTimeout(() => {
      ref.texto = ''
    }, 500)

    const idx = options.findIndex((o) => o.nombre.toLowerCase().startsWith(ref.texto))
    if (idx >= 0) setIndiceActivo(idx)
  }

  const handleKeyDown = (e) => {
    if (disabled) return

    if (!abierto) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        setAbierto(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setIndiceActivo((i) => Math.min(i + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setIndiceActivo((i) => Math.max(i - 1, 0))
        break
      case 'Home':
        e.preventDefault()
        setIndiceActivo(0)
        break
      case 'End':
        e.preventDefault()
        setIndiceActivo(options.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (indiceActivo >= 0) elegir(options[indiceActivo].code)
        break
      case 'Escape':
        e.preventDefault()
        cerrar()
        break
      case 'Tab':
        cerrar()
        break
      default:
        if (e.key.length === 1) buscarPorTecleo(e.key)
    }
  }

  const opcionActivaId = indiceActivo >= 0 && options[indiceActivo] ? `${id}-opcion-${options[indiceActivo].code}` : undefined

  return (
    <div className="combobox-select" ref={raizRef}>
      <button
        type="button"
        id={id}
        ref={botonRef}
        className="form-control combobox-select__boton"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={`${id}-listbox`}
        aria-activedescendant={abierto ? opcionActivaId : undefined}
        disabled={disabled}
        onClick={() => setAbierto((a) => !a)}
        onKeyDown={handleKeyDown}
      >
        <span className={seleccionado ? '' : 'combobox-select__placeholder'}>
          {seleccionado ? seleccionado.nombre : placeholder}
        </span>
      </button>

      {abierto && posicion && createPortal(
        <ul
          className="combobox-select__lista"
          role="listbox"
          id={`${id}-listbox`}
          ref={listaRef}
          style={{
            left: posicion.left,
            top: posicion.top,
            width: posicion.width,
            maxHeight: posicion.maxHeight,
          }}
        >
          {options.map((opcion, idx) => (
            <li
              key={opcion.code}
              id={`${id}-opcion-${opcion.code}`}
              role="option"
              aria-selected={opcion.code === value}
              className={`combobox-select__opcion${idx === indiceActivo ? ' combobox-select__opcion--activa' : ''}`}
              onMouseEnter={() => setIndiceActivo(idx)}
              onMouseDown={(e) => {
                e.preventDefault() // evita el blur del botón antes de procesar la elección
                elegir(opcion.code)
              }}
            >
              {opcion.nombre}
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </div>
  )
}

export default ComboboxSelect
