import countries from 'i18n-iso-countries'
import es from 'i18n-iso-countries/langs/es.json'
import en from 'i18n-iso-countries/langs/en.json'

// Lista de nacionalidades para el <select> de PerfilPanel (Nacionalidad): datos ISO
// 3166-1 locales, sin llamar a ninguna API externa en cada carga de la página.
countries.registerLocale(es)
countries.registerLocale(en)

const IDIOMAS_SOPORTADOS = ['es', 'en']

// value = código alpha-2 (estable entre idiomas, a diferencia del nombre) -
// label = nombre oficial del país en el idioma activo de la app.
export function getNacionalidades(idioma) {
  const lang = IDIOMAS_SOPORTADOS.includes(idioma) ? idioma : 'es'
  const nombresPorCodigo = countries.getNames(lang, { select: 'official' })

  return Object.entries(nombresPorCodigo)
    .map(([code, nombre]) => ({ code, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, lang))
}
