# Design Document — juegos

## Overview

Esta feature sustituye el catálogo hardcodeado del Home por un catálogo real
respaldado por MongoDB: una nueva colección `games` con 6 documentos (los
mismos juegos que hoy están hardcodeados en `GamesGrid.jsx`), un dropdown de
plataformas funcional en el Navbar, dos vistas nuevas (Vista de Plataforma y
Vista de Detalle del Juego) y las reglas de negocio de fecha de estreno y
stock que determinan si un juego se puede comprar, reservar, o si el usuario
puede pedir que se le avise por email.

Se apoya en infraestructura ya existente y no se toca su forma de trabajar:
`httpClient.js` + patrón `servicios/*.js` (frontend), `createXxxController`
+ `requireAuth` + `AppError`/`globalErrorHandler` (backend),
`cloudinaryService.js` (se generaliza, ver Design Decisions),
`emailService.js` (se añade un tercer email siguiendo el mismo patrón que
`sendVerificationEmail`/`sendEmailChangeVerification`), y el patrón de
dropdown accesible de `LanguageToggle.jsx`.

Se añaden dos colecciones (`Game`, `GameStockSubscription`), un router
nuevo (`/api/games`), un script de seed/migración de imágenes a Cloudinary,
y en el frontend un dropdown de plataformas, dos páginas nuevas y las
modificaciones de `GamesGrid.jsx`/`GameCard.jsx` para consumir datos reales.

Quedan fuera de alcance (ver Introduction de `requirements.md`): el flujo
real de compra/checkout/reserva, y cualquier panel de administración. La
única forma de mutar `stock` es un script de línea de comandos ejecutado
manualmente por el equipo de desarrollo (Requisito 18, ver Design
Decisions), no un endpoint HTTP.

## Architecture

```mermaid
flowchart LR
    subgraph Frontend[GalinGames_react]
        Navbar["Navbar.jsx"] --> PlataformasDropdown["PlataformasDropdown.jsx"]
        PlataformasDropdown --> Router["AppRouter.jsx"]
        Router --> Home["Home.jsx"]
        Home --> GamesGrid["GamesGrid.jsx"]
        GamesGrid --> GameCard["GameCard.jsx\n(hover vídeo)"]
        Router --> VistaPlataforma["VistaPlataforma.jsx"]
        VistaPlataforma --> Breadcrumb["Breadcrumb.jsx"]
        VistaPlataforma --> GamesGrid
        Router --> DetalleJuego["DetalleJuego.jsx"]
        DetalleJuego --> CabeceraJuego["CabeceraJuego.jsx\n(wallpaper header)"]
        DetalleJuego --> SeccionInfo["SeccionInfo.jsx\n(specs + características)"]
        GameCard --> gameService["servicios/gameService.js"]
        VistaPlataforma --> gameService
        DetalleJuego --> gameService
        CabeceraJuego --> gameService
        gameService --> httpClient["servicios/httpClient.js"]
    end

    subgraph Backend[GalinGames_nodejs]
        gameRoutes["routes/game.routes.js\n/api/games"] --> gameController["controllers/gameController.js"]
        gameController --> requireAuth["middleware/authMiddleware.js\nrequireAuth\n(solo /notificarme)"]
        gameController --> GameModel[("Game")]
        gameController --> GameStockSubscriptionModel[("GameStockSubscription")]
        seedScript["scripts/seedGames.js"] --> GameModel
        seedScript --> cloudinaryService["services/cloudinaryService.js\nuploadImage()"]
        stockScript["scripts/setGameStock.js"] --> GameModel
        stockScript --> gameStockService["services/gameStockService.js"]
        gameStockService --> GameStockSubscriptionModel
        gameStockService --> emailService["services/emailService.js\n(sendStockAvailableEmail)"]
    end

    httpClient -- "fetch credentials:include" --> gameRoutes
    cloudinaryService -- "SDK cloudinary" --> Cloudinary[("Cloudinary")]
    GameModel --- Mongo[("MongoDB")]
    GameStockSubscriptionModel --- Mongo
```

## Components and Interfaces

### Backend — archivos nuevos

```
GalinGames_nodejs/src/
├── models/
│   ├── Game.js                        (nuevo)
│   └── GameStockSubscription.js       (nuevo)
├── controllers/
│   └── gameController.js              (nuevo, patrón createGameController)
├── services/
│   ├── cloudinaryService.js           (modificado: + uploadImage genérico)
│   ├── gameStockService.js            (nuevo)
│   └── emailService.js                (modificado: + sendStockAvailableEmail)
├── utils/
│   └── platformSlug.js                (nuevo: mapeo slug URL ↔ enum de plataforma)
└── routes/
    └── game.routes.js                 (nuevo)

GalinGames_nodejs/scripts/
├── seedGames.js                       (nuevo: inserta los 6 juegos + sube imágenes a Cloudinary)
└── setGameStock.js                    (nuevo: CLI para mutar stock y disparar notificaciones)
```

`server.js` monta el router nuevo (sin ampliar `methods` de CORS: todos los
verbos que usa — GET, POST — ya están permitidos):

```js
app.use('/api/games', gameRoutes);
```
Valida: Requisito 15.

`gameController.js` sigue el patrón de inyección de dependencias de
`addressController.js` (`createGameController({ Game, GameStockSubscription,
gameStockService })`), exportando `module.exports =
createGameController({...defaults})` + `module.exports.createGameController`.

Firmas principales:

```js
// gameController.js
async function listDestacados(req, res, next)          // GET /destacados
async function listPorPlataforma(req, res, next)        // GET /plataforma/:plataforma
async function getDetalle(req, res, next)                // GET /:id
async function suscribirNotificacion(req, res, next)     // POST /:id/notificarme
```

`platformSlug.js` centraliza el mapeo entre el slug de la URL (minúsculas,
usado tanto en frontend como en el parámetro `:plataforma` del backend) y el
valor real del enum `Game.plataformas[].plataforma`:

```js
const SLUG_TO_PLATFORM = { pc: 'PC', playstation: 'PlayStation', xbox: 'Xbox', nintendo: 'Nintendo' };
function resolvePlatform(slug)   // → 'PC' | 'PlayStation' | 'Xbox' | 'Nintendo' | null
```

`gameStockService.js` centraliza el envío de notificaciones cuando el stock
de una combinación juego+plataforma pasa a ser mayor que 0 (Requisito 13.4),
reutilizado tanto por `setGameStock.js` como, en el futuro, por el flujo
real de pedidos:

```js
// gameStockService.js
async function notifySubscribers(gameId, plataforma)
// busca GameStockSubscription de esa combinación, envía el email a cada
// suscriptor vía emailService.sendStockAvailableEmail y borra cada
// suscripción ya notificada (Requisito 13.5)
```

`cloudinaryService.js` generaliza `uploadAvatar` (usado hoy por
`userController`) a una función reutilizable por el seed de juegos:

```js
async function uploadImage(buffer, folder)   // → { url, publicId } (mismo stream upload que uploadAvatar)
async function uploadAvatar(buffer, userId)  // sin cambios de comportamiento: uploadImage(buffer, `users/${userId}`)
async function deleteAsset(publicId)         // sin cambios
```

`scripts/seedGames.js` es un script Node ejecutable directamente
(`node scripts/seedGames.js`), no montado en Express: para cada uno de los 6
juegos, sube su imagen de portada (leída de `GalinGames_react/public/*.jpg`)
a Cloudinary vía `cloudinaryService.uploadImage(buffer, 'games/<slug>')`, y
si existe el fichero de wallpaper local correspondiente (ver tarea de
`tasks.md` para dónde colocarlo antes de ejecutar el script) lo sube también;
inserta o actualiza (`findOneAndUpdate` con `upsert`) el documento `Game`
con el resto de datos reales fijados en `requirements.md` (Requisito 18).

`scripts/setGameStock.js` es la única forma de mutar `stock` en esta
feature (ver Design Decisions):

```
node scripts/setGameStock.js <slugJuego> <plataforma> <nuevoStock>
```
Actualiza el stock de esa combinación con `findOneAndUpdate` +
posicional `$` (operación atómica, Requisito 14.5) y, si el stock pasa de 0
a un valor mayor, llama a `gameStockService.notifySubscribers`.

### Frontend — archivos nuevos

```
GalinGames_react/src/
├── router/
│   └── AppRouter.jsx                              (modificado: 2 rutas nuevas)
├── servicios/
│   └── gameService.js                             (nuevo)
├── Componentes/
│   ├── compGlobales/
│   │   ├── NavbarComponente/
│   │   │   ├── Navbar.jsx                         (modificado: dropdown real de Juegos)
│   │   │   ├── PlataformasDropdown.jsx             (nuevo, patrón LanguageToggle.jsx)
│   │   │   └── PlataformasIconos.jsx               (nuevo: SVG PC/PlayStation/Xbox/Nintendo)
│   │   └── BreadcrumbComponente/
│   │       └── Breadcrumb.jsx                      (nuevo, genérico)
│   ├── zonaHome/
│   │   ├── GamesGridComponente/GamesGrid.jsx        (modificado: fetch en vez de array estático)
│   │   └── GameCardComponente/GameCard.jsx          (modificado: plataforma+precio, hover vídeo, navegación)
│   └── zonaJuegos/                                  (nuevo, mismo nivel que zonaHome/zonaCliente)
│       ├── VistaPlataformaComponente/
│       │   ├── VistaPlataforma.jsx
│       │   └── VistaPlataforma.scss
│       └── DetalleJuegoComponente/
│           ├── DetalleJuego.jsx
│           ├── DetalleJuego.scss
│           └── components/
│               ├── CabeceraJuego/CabeceraJuego.jsx        (wallpaper, portada, select, chip, acción)
│               ├── SeccionInfo/SeccionInfo.jsx             (contenedor del scroll bajo la cabecera)
│               ├── EspecificacionesTecnicas/EspecificacionesTecnicas.jsx
│               └── CaracteristicasJuego/CaracteristicasJuego.jsx
```

`AppRouter.jsx` añade, junto a las rutas ya existentes:
```jsx
<Route path="/juegos/:plataforma" element={<VistaPlataforma />} />
<Route path="/juegos/detalle/:id" element={<DetalleJuego />} />
```
Ambas rutas son públicas (el catálogo no requiere sesión), a diferencia de
`/mi-cuenta/:seccion`. Valida: Requisitos 1.4, 6.1, 7.1.

`gameService.js`, construido sobre `httpClient.js` (mismo patrón que
`accountService.js`):

```js
async function getJuegosDestacados()                       // GET /api/games/destacados
async function getJuegosPorPlataforma(plataformaSlug)       // GET /api/games/plataforma/:plataforma
async function getJuegoPorId(id)                            // GET /api/games/:id
async function suscribirNotificacion(gameId, plataforma)    // POST /api/games/:id/notificarme
```

`PlataformasDropdown.jsx` reemplaza el `<span aria-disabled>` de
`'navbar.linkJuegos'` dentro del `.map()` de `ENLACES_PROXIMAMENTE`
(`Navbar.jsx`), replicando el esqueleto de `LanguageToggle.jsx`
(`aria-haspopup`, `aria-expanded`, `role="menu"`, cierre por click-fuera y
Escape) con 4 `<Link role="menuitem">` a `/juegos/pc`, `/juegos/playstation`,
`/juegos/xbox`, `/juegos/nintendo`, cada uno con su icono de
`PlataformasIconos.jsx` antes del texto. Valida: Requisito 1.

`GameCard.jsx` se amplía con:
- Props nuevas: `id`, `nombre`, `plataforma`, `precio`, `videoPreviewUrl`.
- Estado `hover` controlado por `onMouseEnter`/`onMouseLeave`, activado solo
  si `window.matchMedia('(hover: hover) and (pointer: fine)').matches`
  (Requisito 4.5).
- Envuelto en `<Link to={`/juegos/detalle/${id}?plataforma=${plataforma}`}>`
  en vez de un `<div>` suelto (Requisito 5).
- Texto `"${nombre}" - ${plataforma}   ${precioFormateado}` (Requisito 3.1),
  con `precioFormateado` vía `Intl.NumberFormat` (Requisito 3.2).

`GamesGrid.jsx` sustituye el array estático `JUEGOS` por
`useEffect(() => { gameService.getJuegosDestacados()... }, [])` con estado
`loading`/`error`/`juegos` (Requisito 2).

`VistaPlataforma.jsx` lee `useParams().plataforma`, pide
`gameService.getJuegosPorPlataforma(plataforma)`, pinta título + subtítulo
(claves i18n `juegos.plataforma.<slug>.titulo`/`.subtitulo`), `Breadcrumb`
(`Inicio > Juegos > <Plataforma>`) y reutiliza `GamesGrid`'s lista de
`GameCard` (mismo componente, distinta fuente de datos). Valida: Requisito 6.

`DetalleJuego.jsx` lee `useParams().id` y `useSearchParams().get('plataforma')`,
pide `gameService.getJuegoPorId(id)` una única vez, y mantiene
`plataformaSeleccionada` en estado local (inicializada con el query param si
viene y es válido para ese juego, si no con `juego.plataformaDestacada`, si
no con la primera de `juego.plataformas`). Cambiar el `<select>` solo
actualiza ese estado local — sin nueva petición (Requisito 9.3). Renderiza
`CabeceraJuego` (fija, con el wallpaper) y, debajo, `SeccionInfo` (specs +
características), que es el contenido que aparece al hacer scroll
(Requisito 7).

## Data Models

### Game (nuevo, `GalinGames_nodejs/src/models/Game.js`)

| Campo | Tipo | Notas |
|---|---|---|
| `nombre` | String, required, trim | |
| `slug` | String, required, unique, lowercase, trim | usado por el seed y por `scripts/setGameStock.js` |
| `descripcion` | String, required | sinopsis del producto (Requisito 19.1); nunca se hardcodea en frontend/i18n (Requisito 19.2) |
| `imagenPortada` | String, required | URL segura de Cloudinary |
| `imagenWallpaper` | String, default `null` | URL segura de Cloudinary; `null` mientras no se disponga de la imagen (Requisito 18.7) |
| `videoPreviewUrl` | String, default `null` | URL externa, no se re-aloja (Requisito 18.6) |
| `fechaEstreno` | Date, required | fecha real de lanzamiento (Requisito 16.1) |
| `plataformaDestacada` | String, enum `['PC','PlayStation','Xbox','Nintendo']`, default `null` | plataforma mostrada en la tarjeta del Home (Requisito 2.5); debe ser una de `plataformas[].plataforma` (validación a nivel de schema) |
| `caracteristicas` | subdocumento (ver abajo) | Requisito 8 |
| `plataformas` | array de subdocumentos `DisponibilidadPlataforma` (ver abajo) | mínimo 1 elemento |

#### `caracteristicas` (subdocumento embebido)

| Campo | Tipo | Notas |
|---|---|---|
| `jugadores.tipo` | String, enum `['individual','multijugador']` | opcional |
| `jugadores.maximo` | Number, min 1 | opcional, solo aplica si `tipo === 'multijugador'` |
| `online` | Boolean, default `false` | |
| `crossplay` | Boolean, default `false` | |
| `hdr` | Boolean, default `false` | |
| `mandosCompatibles` | [String], default `[]` | |

#### `plataformas[]` — `DisponibilidadPlataforma` (subdocumento embebido)

| Campo | Tipo | Notas |
|---|---|---|
| `plataforma` | String, enum `['PC','PlayStation','Xbox','Nintendo']`, required | |
| `formatos` | [String], enum `['fisico','digital']`, required, mínimo 1 | validación custom: si `plataforma === 'PC'`, `formatos` DEBE ser exactamente `['digital']` (Requisito 11.1) |
| `precio` | Number, required, min 0 | por combinación juego+plataforma (Requisito 9.3) |
| `stock` | Number, default 0, min 0 | único campo mutable tras el seed, vía `scripts/setGameStock.js` |
| `especificacionesPC` | subdocumento opcional (solo si `plataforma === 'PC'`) | ver abajo |
| `especificacionesConsola` | subdocumento opcional (solo si `plataforma !== 'PC'`) | ver abajo |

`especificacionesPC`: `{ minimas: { cpu, ram, gpu, almacenamiento,
sistemaOperativo }, recomendadas: { cpu, ram, gpu, almacenamiento,
sistemaOperativo } }` (todos `String` salvo que se prefiera `almacenamiento`
como `Number` en GB — se deja como `String` para poder escribir "65 GB SSD"
tal cual, igual que las fuentes consultadas en `requirements.md`).

`especificacionesConsola`: `{ almacenamiento: String, notas: [String] }`
(p. ej. `notas: ['PS5 Pro Enhanced']`).

Ambos subdocumentos son opcionales de forma independiente: si no se define
ninguno para una combinación, el frontend oculta el bloque de
especificaciones (Requisito 10.3) — cubre directamente a Grand Theft Auto VI
y Marvel's Wolverine, que no tienen versión de PC.

Índices: `GameSchema.index({ slug: 1 }, { unique: true })` (consulta
principal del seed/script de stock); `GameSchema.index({ 'plataformas.plataforma': 1 })`
(consulta de la Vista de Plataforma, Requisito 15.2).

### GameStockSubscription (nuevo, `GalinGames_nodejs/src/models/GameStockSubscription.js`)

| Campo | Tipo | Notas |
|---|---|---|
| `userId` | ObjectId, ref `User`, required | patrón ya usado en `Address.userId` |
| `gameId` | ObjectId, ref `Game`, required | |
| `plataforma` | String, enum `['PC','PlayStation','Xbox','Nintendo']`, required | |
| `createdAt` | Date, `default: Date.now`, immutable | |

Índice único compuesto `{ userId: 1, gameId: 1, plataforma: 1 }` —
garantiza a nivel de base de datos que no se dupliquen suscripciones
(Requisito 13.3); el controlador captura el error `11000` de duplicado
(mismo patrón que `globalErrorHandler.resolveError` ya hace para
`username`/`email`) y responde éxito idempotente en vez de un 409.

El documento se borra tras notificar (`gameStockService.notifySubscribers`,
Requisito 13.5) — no lleva campo `notificado`.

## API Design

Todos los endpoints bajo `/api/games` son públicos salvo
`POST /:id/notificarme`, que requiere `requireAuth` y opera exclusivamente
sobre `req.user.userId` (Requisito 15.4).

### Catálogo

| Método | Ruta | Body | Respuesta éxito | Errores |
|---|---|---|---|---|
| GET | `/api/games/destacados` | — | `200 [{ id, nombre, slug, imagenPortada, plataforma, precio }]` — **proyección reducida** (6 elementos, `plataforma`/`precio` según `plataformaDestacada` de cada juego, sin `descripcion`/especificaciones/`caracteristicas`) | 500 |
| GET | `/api/games/plataforma/:plataforma` | — | `200 [{ id, nombre, slug, imagenPortada, precio }]` — **proyección reducida** (`precio` de esa plataforma concreta) | 404 (`:plataforma` no es un slug válido) |
| GET | `/api/games/:id` | — | `200 { id, nombre, slug, descripcion, imagenPortada, imagenWallpaper, videoPreviewUrl, fechaEstreno, estrenado, caracteristicas, plataformas: [{ plataforma, formatos, precio, stock, especificacionesPC?, especificacionesConsola? }] }` — **proyección completa** | 404 (id inexistente o inválido) |

Las consultas de `listDestacados`/`listPorPlataforma` usan `.select('nombre
slug imagenPortada plataformaDestacada plataformas.plataforma
plataformas.precio')` (Mongoose/Mongo no transmite por red los campos
excluidos de un `.select()`), de forma que el contenido pesado
(`descripcion`, especificaciones, características) nunca viaja en un
listado — cubre el Requisito 19.5 sin necesitar una colección aparte.

Valida: Requisitos 2.1–2.5, 6.3–6.4, 7.1–7.4, 9.1–9.3, 10.1–10.3, 11.1–11.4,
15.1–15.3, 15.5, 16.2, 19.1, 19.2, 19.5.

`estrenado` (booleano) se calcula en el controlador comparando
`fechaEstreno` con `new Date()` en el momento de la petición (Requisito
16.2) y se envía ya resuelto para que el frontend no reimplemente la
comparación de fechas.

### Suscripción de disponibilidad

| Método | Ruta | Body | Respuesta éxito | Errores |
|---|---|---|---|---|
| POST | `/api/games/:id/notificarme` | `{ plataforma }` | `201 { message }` (nueva suscripción) / `200 { message, yaSuscrito: true }` (ya existía) | 400 (`plataforma` inválida o sin stock=0 en esa combinación), 401 (no autenticado), 404 (`:id` inexistente) |

Valida: Requisitos 12.1–12.4 (renumerados en `requirements.md` como
13.1–13.4), 15.4.

El envío real del email (Requisito 13.4/13.5) no ocurre en este endpoint:
ocurre de forma asíncrona cuando `scripts/setGameStock.js` detecta que el
stock de esa combinación pasa de 0 a mayor que 0 y llama a
`gameStockService.notifySubscribers`.

## Security

- Todos los endpoints de lectura del catálogo son públicos (no exponen
  datos de usuario), consistente con que el catálogo es información de
  producto, no de cuenta.
- `POST /:id/notificarme` es el único endpoint protegido; usa
  `requireAuth` y opera solo sobre `req.user.userId`, nunca sobre un id
  recibido en el body (mismo criterio que `addressController`).
- **No existe ningún endpoint HTTP para mutar `stock`.** La única vía es
  `scripts/setGameStock.js`, ejecutado manualmente con acceso directo al
  servidor/repositorio — evita crear una superficie de escritura que
  cualquier usuario autenticado podría alcanzar en un proyecto sin sistema
  de roles (ver Design Decisions).
- Las credenciales `CLOUDINARY_*` ya existentes se reutilizan tal cual
  (`cloudinaryService.js`); no se añaden variables de entorno nuevas.
- El seed (`scripts/seedGames.js`) es un script local, no un endpoint: no
  añade superficie de ataque HTTP.

## Error Handling

Se reutiliza `globalErrorHandler.js`/`AppError` tal cual: `gameController`
lanza `AppError(mensaje, 404)` cuando el `:id` no existe o `:plataforma` no
resuelve a un slug válido (Requisito 15.5), y `AppError(mensaje, 400)` si el
body de `/notificarme` no incluye una `plataforma` válida para ese juego.

El duplicado de suscripción (índice único de `GameStockSubscription`) se
captura explícitamente en el controlador con `try/catch` sobre el
`err.code === 11000` antes de que llegue a `globalErrorHandler`, para poder
responder `200 { yaSuscrito: true }` en vez de un error (Requisito 12.3).

Frontend: `gameService.js` no añade manejo de error propio — cada página
(`GamesGrid`, `VistaPlataforma`, `DetalleJuego`) usa el mismo contrato
`{ ok, data } | { ok: false, status, message }` de `httpClient.js` que ya
usan `PerfilPanel.jsx`/`DireccionesPanel.jsx`, mostrando un mensaje
traducible (`juegos.errorCarga`) cuando `ok === false`.

## Design Decisions

| Decisión | Alternativas consideradas | Por qué se elige | Requisitos |
|---|---|---|---|
| `plataformas[]` embebido dentro de `Game` | Colección `GamePlatformAvailability` aparte, referenciada por `gameId` | Máximo 4 combinaciones por juego, siempre consultadas junto al juego completo (nunca "todas las combinaciones de todos los juegos" de forma aislada) — una colección aparte solo añadiría joins innecesarios | 13, 14 |
| `plataformaDestacada` como campo fijo persistido en el seed | Elegir la plataforma "destacada" dinámicamente en cada petición a `/destacados` | El conjunto de 6 juegos es estático por ahora; calcularlo en caliente añadiría lógica de "variedad" sin ningún beneficio real hasta que el catálogo crezca | 2.5 |
| Mutación de `stock` solo vía script CLI (`setGameStock.js`), sin endpoint HTTP | Endpoint `PATCH /api/games/:id/plataformas/:plataforma/stock` protegido con `requireAuth` | El proyecto no tiene sistema de roles/admin; un endpoint protegido solo con `requireAuth` sería mutable por cualquier usuario autenticado. Construir roles es explícitamente fuera de alcance de esta spec — un script con acceso directo al servidor es la única superficie seura sin esa infraestructura | 18 (introducción) |
| `GameStockSubscription` se borra tras notificar, sin campo `notificado` | Marcar `notificado: true` y conservar el histórico | Nada en esta feature necesita el histórico de notificaciones enviadas; conservarlo sería un dato muerto. Si el juego se agota de nuevo, el usuario simplemente vuelve a suscribirse (comportamiento ya exigido por el Requisito 13.5) | 13.5 |
| `cloudinaryService.uploadAvatar` generalizado a `uploadImage(buffer, folder)` | Duplicar la lógica de `upload_stream` en un módulo aparte para el seed de juegos | Evita repetir el mismo código de subida a Cloudinary ya probado; `uploadAvatar` pasa a ser un envoltorio de una línea sobre `uploadImage` | 18.4, 18.5 |
| `especificacionesPC`/`especificacionesConsola` como dos subdocumentos con schema propio | Un único campo `especificaciones: Mixed` sin schema | Mongoose valida la forma de cada uno (evita datos inconsistentes tipo specs de PC en una plataforma de consola) y hace explícito, a nivel de modelo, que ambos son mutuamente independientes y opcionales | 10, 14.2 |
| Vídeo de preview servido directamente desde su URL externa (`gaming-cdn.com`), sin re-alojar en Cloudinary | Descargar y volver a subir cada vídeo a Cloudinary, igual que las imágenes | Esta feature no gestiona subida de contenido multimedia propio (los vídeos ya los proporciona el equipo con URLs estables); descargar/transcodificar vídeo añadiría complejidad y coste de almacenamiento sin ningún requisito que lo exija | 18.6 |
| Precio, stock y especificaciones a nivel de combinación juego+plataforma (no un precio único por juego) | Un único precio/stock por juego, común a todas sus plataformas | Regla de negocio explícita: cambiar de plataforma en el select de la Vista de Detalle debe poder cambiar precio, stock y especificaciones mostradas | 9.3 |
| Slugs de plataforma en minúscula en la URL (`/juegos/pc`, `/juegos/playstation`...) mapeados a los valores del enum interno vía `platformSlug.js` | Usar el valor del enum tal cual en la URL (`/juegos/PC`, `/juegos/PlayStation`...) | Slugs en minúscula son más idiomáticos en URLs y evitan ambigüedad de capitalización en la barra de direcciones; el backend sigue validando y trabajando internamente solo con el enum | 1.4, 6.1, 15.2 |
| Botones "Comprar"/"Reservar" sin `onClick` funcional (o navegando a una ruta que aún no existe) | Implementar un flujo mínimo de "pedido simulado" para que el botón haga algo | Fuera de alcance explícito de `requirements.md` (Introduction); añadir un flujo simulado sería trabajo que se rehará por completo en la spec de pedidos | 12.5 |
| Un único `Game` con proyección de campos por endpoint (`.select()`) | Colección `GameDetails` aparte (descripción/especificaciones/características), referenciada por `gameId` y consultada con un `$lookup`/segunda query solo en la Vista de Detalle | Mongo no transmite por red los campos excluidos de un `.select()`, así que el mismo objetivo (no cargar contenido pesado en los listados) se consigue sin la complejidad operativa de mantener dos colecciones sincronizadas (un `Game` sin su `GameDetails`, o viceversa, sería un estado inconsistente a vigilar). Si el catálogo llegara a decenas de miles de documentos con contenido verdaderamente pesado (no es el caso de texto de specs/sinopsis), se podría reconsiderar entonces | 19.1, 19.5 |

## Cobertura de Requisitos

| Requisito | Cubierto por |
|---|---|
| 1. Dropdown de plataformas en el Navbar | `PlataformasDropdown.jsx`, `PlataformasIconos.jsx`, `Navbar.jsx` |
| 2. Grid del Home alimentado por backend | `GET /api/games/destacados`, `GamesGrid.jsx` |
| 3. Contenido y formato de la tarjeta | `GameCard.jsx` |
| 4. Vídeo de preview en hover | `GameCard.jsx` (estado `hover` + `matchMedia`) |
| 5. Navegación tarjeta → detalle | `GameCard.jsx` (`<Link>`), `DetalleJuego.jsx` (query param `plataforma`) |
| 6. Vista de Plataforma | `VistaPlataforma.jsx`, `GET /api/games/plataforma/:plataforma`, `Breadcrumb.jsx` |
| 7. Cabecera (wallpaper) de la Vista de Detalle | `CabeceraJuego.jsx`, `GET /api/games/:id` |
| 8. Características del juego | `CaracteristicasJuego.jsx`, `Game.caracteristicas` |
| 9. Select de plataforma en Vista de Detalle | `DetalleJuego.jsx` (estado `plataformaSeleccionada`) |
| 10. Especificaciones técnicas por plataforma | `EspecificacionesTecnicas.jsx`, `especificacionesPC`/`especificacionesConsola` |
| 11. Formato físico/digital según plataforma | validación de schema en `Game.js` (`formatos` + regla PC) |
| 12. Chip de stock y control de acción condicional | `CabeceraJuego.jsx` (chip + botón según `estrenado`/`stock`) |
| 13. Suscripción a aviso de stock | `POST /:id/notificarme`, `GameStockSubscription`, `gameStockService.js`, `emailService.sendStockAvailableEmail` |
| 14. Modelo de datos del juego | `Game.js`, `GameStockSubscription.js` |
| 15. Endpoints públicos del catálogo | `game.routes.js`, `gameController.js` |
| 16. Reglas de fecha de estreno | `estrenado` calculado en `gameController.getDetalle`/`listPorPlataforma` |
| 17. Internacionalización | claves nuevas bajo el namespace `juegos` en `es.json`/`en.json` |
| 18. Migración de imágenes y datos reales de los 6 juegos | `scripts/seedGames.js`, `scripts/setGameStock.js`, `cloudinaryService.uploadImage` |
| 19. Todo el contenido del juego proviene de MongoDB | `Game.descripcion`, proyección reducida vs. completa en `gameController.js`, ausencia de contenido de juego en `es.json`/`en.json` |

Todos los requisitos de `requirements.md` quedan cubiertos; no se detectan
huecos.
