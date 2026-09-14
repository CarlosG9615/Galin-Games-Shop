import EspecificacionesTecnicas from '../EspecificacionesTecnicas/EspecificacionesTecnicas'
import CaracteristicasJuego from '../CaracteristicasJuego/CaracteristicasJuego'
import './SeccionInfo.scss'

// Contenido que aparece al hacer scroll bajo la Cabecera (Requisito 7.3), sobre el
// fondo normal de la página: la descripción llega tal cual del backend (Requisito
// 19.2/19.3 — ningún texto de juego hardcodeado aquí) y agrupa las especificaciones
// técnicas y las características generales.
function SeccionInfo({ descripcion, plataforma, especificacionesPC, especificacionesConsola, caracteristicas }) {
  return (
    <section className="seccion-info">
      <p className="seccion-info__descripcion">{descripcion}</p>
      <EspecificacionesTecnicas
        plataforma={plataforma}
        especificacionesPC={especificacionesPC}
        especificacionesConsola={especificacionesConsola}
      />
      <CaracteristicasJuego caracteristicas={caracteristicas} />
    </section>
  )
}

export default SeccionInfo
