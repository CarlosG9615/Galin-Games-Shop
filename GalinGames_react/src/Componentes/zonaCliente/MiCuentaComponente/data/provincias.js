import countryRegionData from 'country-region-data/data.json'

// Provincias/regiones de FormularioDireccion (campo Provincia, encadenado a País):
// datos locales de country-region-data, sin llamar a ninguna API externa. A
// diferencia de nacionalidades.js (i18n-iso-countries, con nombres localizados
// es/en), aquí solo hay nombres en su forma local (p. ej. "Andalucía", "Madrid") —
// son topónimos, no se traducen entre idiomas de la app.
//
// value = nombre de la región (no un código): a diferencia del código ISO alpha-2 de
// Nacionalidad, aquí lo que se guarda en Address.provincia es directamente el nombre
// visible (mismo criterio que Address.pais, ver FormularioDireccion.jsx) — no hay
// ningún otro sitio de la app que necesite un código estable para hacer lookup.
export function getProvincias(paisCode) {
  if (!paisCode) return []

  const pais = countryRegionData.find((c) => c.countryShortCode === paisCode)
  if (!pais) return []

  return [...pais.regions]
    .map(({ name }) => ({ code: name, nombre: name }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
}
