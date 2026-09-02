# Implementation Plan: juegos

## Overview

Plan de implementación del catálogo de videojuegos descrito en
`requirements.md` y `design.md`: modelo de datos `Game`/`GameStockSubscription`,
endpoints públicos del catálogo bajo `/api/games`, el script de migración
que sube las imágenes reales a Cloudinary y puebla los 6 juegos, el script
de mutación de stock (única vía para simular altas de stock y disparar
notificaciones), el dropdown de plataformas del Navbar, y las dos vistas
nuevas (Vista de Plataforma y Vista de Detalle del Juego con cabecera
wallpaper + Sección INFO).

Cada tarea de modelo/servicio/controlador/componente incluye sus tests
correspondientes, siguiendo la convención ya existente en el repo
(`GalinGames_nodejs/tests/unit/*`, `*.test.jsx` co-ubicado en frontend). Las
tareas de la sección "Scripts de datos" son las que te guían paso a paso
para insertar los juegos e imágenes reales en MongoDB — no requieren tocar
código más allá de ejecutar el script ya escrito.

Las tareas se ejecutan de una en una vía `/spec-execute`, en el orden que
respete las dependencias indicadas.

## Tasks

### Backend — Modelos

- [x] 1. Crear `GalinGames_nodejs/src/models/Game.js` (schema completo: `nombre`, `slug` único, `descripcion` required, `imagenPortada`, `imagenWallpaper`, `videoPreviewUrl`, `fechaEstreno`, `plataformaDestacada`, subdocumento `caracteristicas`, array `plataformas[]` con `especificacionesPC`/`especificacionesConsola` opcionales y validación custom de que `PC` solo admite `formatos: ['digital']`, índices `slug` único y `plataformas.plataforma`), + tests en `tests/unit/Game.test.js`
  **Dependencias:** ninguna
  **Requisitos:** 8.4, 11.1, 11.2, 14.1, 14.2, 14.4, 14.6, 16.1, 19.1

- [x] 2. Crear `GalinGames_nodejs/src/models/GameStockSubscription.js` (`userId` ref `User`, `gameId` ref `Game`, `plataforma`, índice único compuesto `{userId,gameId,plataforma}`), + tests en `tests/unit/GameStockSubscription.test.js`
  **Dependencias:** ninguna
  **Requisitos:** 13.1, 13.3, 14.3

### Backend — Servicios

- [x] 3. Generalizar `GalinGames_nodejs/src/services/cloudinaryService.js`: extraer `uploadImage(buffer, folder)` y reescribir `uploadAvatar` como envoltorio de `uploadImage(buffer, \`users/${userId}\`)`, sin cambiar su comportamiento observable, + actualizar `tests/unit/cloudinaryService.test.js`
  **Dependencias:** ninguna
  **Requisitos:** 18.4, 18.5

- [x] 4. Crear `GalinGames_nodejs/src/utils/platformSlug.js` (`resolvePlatform(slug)` mapeando `pc/playstation/xbox/nintendo` → `PC/PlayStation/Xbox/Nintendo`, `null` si no reconoce el slug), + tests en `tests/unit/platformSlug.test.js`
  **Dependencias:** ninguna
  **Requisitos:** — (soporte interno de 6.3, 15.2, 15.5)

- [x] 5. Añadir `sendStockAvailableEmail` a `GalinGames_nodejs/src/services/emailService.js` (plantilla HTML propia siguiendo el estilo morado "GalinGames" ya usado, enlace a la Vista de Detalle del juego, reutilizando `createEmailService`), + tests en `tests/unit/emailService.test.js`
  **Dependencias:** ninguna
  **Requisitos:** 13.4

- [x] 6. Crear `GalinGames_nodejs/src/services/gameStockService.js` (`notifySubscribers(gameId, plataforma)`: busca `GameStockSubscription` de esa combinación, envía `emailService.sendStockAvailableEmail` a cada suscriptor y borra cada suscripción notificada), + tests en `tests/unit/gameStockService.test.js` con dobles de `emailService`/modelos
  **Dependencias:** Tareas 2, 5
  **Requisitos:** 13.4, 13.5

### Backend — Controlador y rutas

- [x] 7. Crear `GalinGames_nodejs/src/controllers/gameController.js` — `listDestacados`/`listPorPlataforma` con proyección reducida (`.select()` excluyendo `descripcion`/especificaciones/`caracteristicas`) y `getDetalle` con proyección completa (con `estrenado` calculado comparando `fechaEstreno` con `new Date()`), patrón `createGameController({ Game, platformSlug })`, + tests en `tests/unit/gameController.test.js` (incluye test de que el listado NO devuelve `descripcion`)
  **Dependencias:** Tareas 1, 4
  **Requisitos:** 2.1, 2.5, 6.3, 6.4, 7.1, 9.1, 10.1, 10.2, 10.3, 11.3, 11.4, 15.1, 15.2, 15.3, 15.5, 16.2, 19.5

- [x] 8. Añadir a `gameController.js` el handler `suscribirNotificacion` (valida `plataforma` del body contra el juego, exige stock=0 en esa combinación, captura `err.code === 11000` de `GameStockSubscription` y responde `200 { yaSuscrito: true }` en vez de propagar el error), + tests
  **Dependencias:** Tareas 1, 2, 4
  **Requisitos:** 13.1, 13.2, 13.3, 15.4

- [x] 9. Crear `GalinGames_nodejs/src/routes/game.routes.js` (monta `listDestacados`/`listPorPlataforma`/`getDetalle` públicos y `suscribirNotificacion` bajo `requireAuth`), + tests de integración con `supertest`
  **Dependencias:** Tareas 7, 8
  **Requisitos:** 15.1, 15.2, 15.3, 15.4

- [x] 10. Montar `game.routes.js` en `GalinGames_nodejs/server.js` (`app.use('/api/games', gameRoutes)`)
  **Dependencias:** Tarea 9
  **Requisitos:** 15

### Backend — Scripts de datos (migración de los 6 juegos)

- [ ] 11. **(Manual, guía para ti — PENDIENTE, requiere tus imágenes)** Reunir las imágenes wallpaper de los 6 juegos (descargadas de fuente oficial/verificada) y colocarlas en `GalinGames_nodejs/scripts/assets/wallpapers/<slug>.jpg` (slugs: `assassins-creed-black-flag-resynced`, `blood-of-dawnwalker`, `dragon-ball-sparking-zero`, `ea-sports-fc-27`, `grand-theft-auto-vi`, `marvels-wolverine`); para cualquier juego sin wallpaper todavía, `seedGames.js` (Tarea 12, ya implementado) deja `imagenWallpaper` en `null` automáticamente en vez de reutilizar otra imagen — no se ha fabricado ninguna imagen para completar esta tarea.
  **Dependencias:** ninguna
  **Requisitos:** 18.5, 18.7

- [x] 12. Crear `GalinGames_nodejs/scripts/seedGames.js` (script Node ejecutable con `node scripts/seedGames.js`: para cada uno de los 6 juegos, sube la portada ya existente en `GalinGames_react/public/*.jpg` y, si existe, el wallpaper de la Tarea 11 a Cloudinary vía `cloudinaryService.uploadImage`, y hace `findOneAndUpdate` con `upsert` sobre `Game` con los datos reales fijados en `requirements.md` — fechas de estreno, plataformas, formatos, precios, stock inicial, especificaciones técnicas de PC, `videoPreviewUrl` tal cual sin re-alojar, y una `descripcion`/sinopsis propia de cada juego escrita en el propio script de seed, nunca en un componente o fichero de i18n)
  **Dependencias:** Tareas 1, 3, 11
  **Requisitos:** 18.1, 18.2, 18.3, 18.4, 18.6, 18.8, 18.9, 19.1, 19.4

- [ ] 13. **(PENDIENTE — acción tuya)** Ejecutar `node scripts/seedGames.js` contra la base de datos de desarrollo y verificar en Mongo (p. ej. `mongosh` o Compass) que los 6 documentos `Game` existen con sus datos e imágenes correctos. No se ha ejecutado automáticamente: escribe en tu base de datos real y sube imágenes reales a tu cuenta de Cloudinary (consumo de cuota), y hoy solo subiría 6 portadas — las wallpapers quedarían en `null` hasta completar la Tarea 11. Ejecuta este comando tú mismo cuando quieras (con o sin wallpapers todavía).
  **Dependencias:** Tarea 12
  **Requisitos:** 18 (verificación)

- [x] 14. Crear `GalinGames_nodejs/scripts/setGameStock.js` (CLI `node scripts/setGameStock.js <slugJuego> <plataforma> <nuevoStock>`: actualiza el stock de esa combinación con `findOneAndUpdate` + `$` posicional de forma atómica, y si el stock pasa de 0 a mayor que 0 llama a `gameStockService.notifySubscribers`)
  **Dependencias:** Tareas 1, 6
  **Requisitos:** 14.5, 18

### Frontend — Infraestructura

- [ ] 15. Crear `GalinGames_react/src/servicios/gameService.js` (`getJuegosDestacados`, `getJuegosPorPlataforma`, `getJuegoPorId`, `suscribirNotificacion`, sobre `httpClient.js`), + tests
  **Dependencias:** ninguna
  **Requisitos:** — (soporte interno de 2, 6, 7, 13)

- [ ] 16. Añadir el namespace `juegos` a `GalinGames_react/src/i18n/locales/es.json` y `en.json` (dropdown de plataformas, títulos/subtítulos de la Vista de Plataforma, breadcrumb, cabecera, Sección INFO, características, chip de stock, botones Comprar/Reservar/Avisarme, mensajes de estado vacío/error/no encontrado)
  **Dependencias:** ninguna
  **Requisitos:** 17.1, 17.2, 17.3

- [ ] 17. Crear `GalinGames_react/src/Componentes/compGlobales/NavbarComponente/PlataformasIconos.jsx` (SVG inline de PC, PlayStation, Xbox, Nintendo, mismo patrón que `NavbarIconos.jsx`)
  **Dependencias:** ninguna
  **Requisitos:** 1.5

- [ ] 18. Crear `GalinGames_react/src/Componentes/compGlobales/BreadcrumbComponente/Breadcrumb.jsx` (genérico, recibe una lista de `{ label, to? }`), + tests
  **Dependencias:** ninguna
  **Requisitos:** 6.2

### Frontend — Navbar

- [ ] 19. Crear `GalinGames_react/src/Componentes/compGlobales/NavbarComponente/PlataformasDropdown.jsx` (mismo esqueleto que `LanguageToggle.jsx`: `aria-haspopup`, `aria-expanded`, `role="menu"`, cierre por click-fuera/Escape, 4 `<Link role="menuitem">` a `/juegos/pc|playstation|xbox|nintendo` con icono de `PlataformasIconos.jsx`), + tests
  **Dependencias:** Tareas 16, 17
  **Requisitos:** 1.2, 1.3, 1.4

- [ ] 20. Modificar `GalinGames_react/src/Componentes/compGlobales/NavbarComponente/Navbar.jsx`: quitar `'navbar.linkJuegos'` de `ENLACES_PROXIMAMENTE` y montar `PlataformasDropdown` en su lugar, + tests
  **Dependencias:** Tarea 19
  **Requisitos:** 1.1

### Frontend — Home

- [ ] 21. Modificar `GalinGames_react/src/Componentes/zonaHome/GameCardComponente/GameCard.jsx`: props nuevas (`id`, `nombre`, `plataforma`, `precio`, `videoPreviewUrl`), estado `hover` con guardia `matchMedia('(hover: hover) and (pointer: fine)')`, texto `"${nombre}" - ${plataforma}   ${precioFormateado}` (`Intl.NumberFormat`), envoltura `<Link to="/juegos/detalle/:id?plataforma=...">`, + tests
  **Dependencias:** Tareas 15, 16
  **Requisitos:** 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2

- [ ] 22. Modificar `GalinGames_react/src/Componentes/zonaHome/GamesGridComponente/GamesGrid.jsx`: sustituir el array estático `JUEGOS` por `gameService.getJuegosDestacados()` en `useEffect`, con estados `loading`/`error`, + tests
  **Dependencias:** Tareas 15, 21
  **Requisitos:** 2.1, 2.2, 2.3, 2.4

### Frontend — Vista de Plataforma

- [ ] 23. Crear `GalinGames_react/src/Componentes/zonaJuegos/VistaPlataformaComponente/VistaPlataforma.jsx` (lee `useParams().plataforma`, pide `gameService.getJuegosPorPlataforma`, título + subtítulo, `Breadcrumb`, reutiliza `GameCard` en grid, estado vacío/error), + tests
  **Dependencias:** Tareas 15, 16, 18, 21
  **Requisitos:** 6.1, 6.2, 6.3, 6.4, 6.5

### Frontend — Vista de Detalle del Juego

- [ ] 24. Crear `GalinGames_react/src/Componentes/zonaJuegos/DetalleJuegoComponente/components/CaracteristicasJuego/CaracteristicasJuego.jsx` (divs de jugadores/online/crossplay/HDR/mandos compatibles, oculta cada div si el dato no está definido), + tests
  **Dependencias:** Tarea 16
  **Requisitos:** 8.1, 8.2, 8.3

- [ ] 25. Crear `GalinGames_react/src/Componentes/zonaJuegos/DetalleJuegoComponente/components/EspecificacionesTecnicas/EspecificacionesTecnicas.jsx` (bloques mínimas/recomendadas si `plataforma === 'PC'`, disco+notas en el resto, oculta el bloque si no hay datos para esa combinación), + tests
  **Dependencias:** Tarea 16
  **Requisitos:** 10.1, 10.2, 10.3

- [ ] 26. Crear `GalinGames_react/src/Componentes/zonaJuegos/DetalleJuegoComponente/components/CabeceraJuego/CabeceraJuego.jsx` (wallpaper de ancho completo con fondo de respaldo si falta, altura estable, div portada a la izquierda, div derecho con select de plataforma, chip de stock, precio y control Comprar/Reservar/Avisarme según `estrenado`+`stock`, nunca "Comprar" si no está estrenado, llamada a `gameService.suscribirNotificacion` con redirect a login si no autenticado), + tests
  **Dependencias:** Tareas 15, 16
  **Requisitos:** 7.1, 7.2, 7.4, 7.5, 9.1, 9.2, 11.3, 11.4, 12.1, 12.2, 12.3, 12.4, 12.5, 13.1, 13.2, 13.3, 16.3

- [ ] 27. Crear `GalinGames_react/src/Componentes/zonaJuegos/DetalleJuegoComponente/components/SeccionInfo/SeccionInfo.jsx` (contenedor bajo la cabecera, sobre fondo normal: pinta el texto de `juego.descripcion` recibido del backend tal cual, sin ningún texto de juego hardcodeado en el componente, y agrupa `EspecificacionesTecnicas` + `CaracteristicasJuego`), + tests
  **Dependencias:** Tareas 24, 25
  **Requisitos:** 7.3, 19.2, 19.3

- [ ] 28. Crear `GalinGames_react/src/Componentes/zonaJuegos/DetalleJuegoComponente/DetalleJuego.jsx` (lee `useParams().id` + `useSearchParams().get('plataforma')`, pide `gameService.getJuegoPorId` una vez, estado `plataformaSeleccionada` que cambia sin refetch, estado "juego no encontrado" traducible, renderiza `CabeceraJuego` + `SeccionInfo`), + tests
  **Dependencias:** Tareas 15, 26, 27
  **Requisitos:** 5.3, 9.3

### Frontend — Routing

- [ ] 29. Modificar `GalinGames_react/src/router/AppRouter.jsx`: añadir `<Route path="/juegos/:plataforma" element={<VistaPlataforma />} />` y `<Route path="/juegos/detalle/:id" element={<DetalleJuego />} />` (rutas públicas), + tests
  **Dependencias:** Tareas 23, 28
  **Requisitos:** 1.4, 6.1, 7.1

## Task Dependency Graph

```mermaid
flowchart TD
    subgraph Backend
        T1[1 Game model] --> T7[7 gameController lectura]
        T1 --> T8[8 gameController notificarme]
        T1 --> T12[12 seedGames.js]
        T1 --> T14[14 setGameStock.js]
        T2[2 GameStockSubscription] --> T6[6 gameStockService]
        T2 --> T8
        T3[3 cloudinaryService.uploadImage] --> T12
        T4[4 platformSlug] --> T7
        T4 --> T8
        T5[5 emailService ext] --> T6
        T6 --> T14
        T7 --> T9[9 game.routes]
        T8 --> T9
        T9 --> T10[10 server.js wiring]
        T11[11 wallpapers manual] --> T12
        T12 --> T13[13 ejecutar seed]
    end

    subgraph Frontend
        T15[15 gameService] --> T21[21 GameCard]
        T16[16 i18n juegos] --> T19[19 PlataformasDropdown]
        T17[17 PlataformasIconos] --> T19
        T19 --> T20[20 Navbar dropdown]
        T15 --> T22[22 GamesGrid]
        T16 --> T21
        T21 --> T22
        T15 --> T23[23 VistaPlataforma]
        T16 --> T23
        T18[18 Breadcrumb] --> T23
        T21 --> T23
        T16 --> T24[24 CaracteristicasJuego]
        T16 --> T25[25 EspecificacionesTecnicas]
        T24 --> T27[27 SeccionInfo]
        T25 --> T27
        T15 --> T26[26 CabeceraJuego]
        T16 --> T26
        T15 --> T28[28 DetalleJuego]
        T26 --> T28
        T27 --> T28
        T23 --> T29[29 AppRouter rutas]
        T28 --> T29
    end

    T10 -.integración runtime.-> T15
```

## Orden de ejecución sugerido (waves)

1. **Backend modelos**: 1, 2
2. **Backend servicios**: 3, 4, 5, 6
3. **Backend controlador y rutas**: 7, 8, 9
4. **Backend wiring**: 10
5. **Backend scripts de datos**: 11, 12, 13, 14
6. **Frontend infraestructura**: 15, 16, 17, 18
7. **Frontend Navbar**: 19, 20
8. **Frontend Home**: 21, 22
9. **Frontend Vista de Plataforma**: 23
10. **Frontend Vista de Detalle**: 24, 25, 26, 27, 28
11. **Frontend routing**: 29

## Cobertura

| Requisito | Cubierto por |
|---|---|
| 1. Dropdown de plataformas en el Navbar | 17, 19, 20 |
| 2. Grid del Home alimentado por backend | 7, 21, 22 |
| 3. Contenido y formato de la tarjeta | 21 |
| 4. Vídeo de preview en hover | 21 |
| 5. Navegación tarjeta → detalle | 21, 28 |
| 6. Vista de Plataforma | 18, 23, 29 |
| 7. Cabecera (wallpaper) de la Vista de Detalle | 7, 26, 27, 29 |
| 8. Características del juego | 24 |
| 9. Select de plataforma en Vista de Detalle | 7, 26, 28 |
| 10. Especificaciones técnicas por plataforma | 7, 25 |
| 11. Formato físico/digital según plataforma | 1, 7, 26 |
| 12. Chip de stock y control de acción condicional | 26 |
| 13. Suscripción a aviso de stock | 2, 5, 6, 8, 26, 27 |
| 14. Modelo de datos del juego | 1, 2, 7, 14 |
| 15. Endpoints públicos del catálogo | 7, 8, 9, 10 |
| 16. Reglas de fecha de estreno | 1, 7, 26 |
| 17. Internacionalización | 16 |
| 18. Migración de imágenes y datos reales | 3, 11, 12, 13, 14 |
| 19. Todo el contenido del juego proviene de MongoDB | 1, 7, 12, 27 |

Los 19 requisitos de `requirements.md` y todos los componentes de
`design.md` (modelos, servicios, controlador, rutas, scripts de datos,
componentes React, i18n, wiring de `server.js`) quedan cubiertos por al
menos una tarea.
