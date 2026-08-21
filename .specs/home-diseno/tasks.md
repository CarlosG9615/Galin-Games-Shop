# Implementation Plan: Home con temas visuales (home-diseno)

## Overview

Plan de implementación de la nueva Home pública de GalinGames con dos temas visuales intercambiables (azul/violeta y rojo/gris/negro), un Navbar genérico reutilizable, y la migración a SCSS de las hojas de estilo existentes tocadas por esta feature. Todo el trabajo es frontend (`GalinGames_react/`); no hay cambios de backend. El orden sigue las dependencias reales: primero la infraestructura de tema y estilos compartidos, después el Navbar (que todo lo demás reutiliza), después la Home en sí, y por último la migración visual de Login/Registro/ErrorPage y la actualización de los tests ya existentes que se ven afectados.

---

## Tasks

### Phase 1 — Fundamentos: tema y estilos compartidos

---

- [x] 1. Instalar Sass en el frontend
  **Dependencias:** Ninguna
  **Requisitos:** Req 9.1

  - [x] 1.1 Ejecutar `npm install -D sass` en `GalinGames_react/`
    - Verificar que queda registrado en `package.json`/`package-lock.json`
    - _Requisitos: 9.1_

---

- [x] 2. `src/styles/_tokens.scss` — Design Tokens de ambos temas
  **Dependencias:** Task 1
  **Requisitos:** Req 1.6, 1.7, 9.3, 9.6

  - [x] 2.1 Crear `src/styles/_tokens.scss` con dos bloques `[data-theme="azul"]` y `[data-theme="rojo"]` sobre `:root`, definiendo las variables CSS de la tabla de `design.md` → Design Tokens: `--color-fondo`, `--color-fondo-elevado`, `--color-acento`, `--color-acento-secundario`, `--color-texto`, `--color-texto-tenue`, `--sombra-acento`
    - _Requisitos: 1.6, 1.7, 9.3_

  - [x] 2.2 Importar `_tokens.scss` desde `src/index.css` (o convertir `index.css` a `index.scss` e importarlo ahí) para que las variables estén disponibles globalmente antes de cualquier componente
    - _Requisitos: 9.6_
    - _Nota: se convirtió `index.css` a `index.scss` (con `@use './styles/tokens';`) y se actualizó el import en `main.jsx`. Los valores por defecto de `:root` (sin atributo) son los del tema azul, sirviendo de fallback antes de que `ThemeProvider` aplique `data-theme` vía `useLayoutEffect`._

---

- [x] 3. `src/styles/_shared.scss` — clases reutilizadas entre Login/Registro/ErrorPage
  **Dependencias:** Task 2
  **Requisitos:** Req 7.2, 9.3, 9.4, 9.8, 8.2, 8.4

  - [x] 3.1 Definir `.pagina-tematica` (fondo de página con degradado radial usando `var(--color-fondo)`, sustituye a `.fondo-gaming`), `.pagina-tematica__contenido` (contenedor centrado)
    - _Requisitos: 7.2_

  - [x] 3.2 Definir `.tarjeta-tema` (consolida `.color-fondo` + `.marginForm` + `.contenido-registro` + `.form-box`: fondo `var(--color-fondo-elevado)`, borde y sombra usando `var(--color-acento)`/`var(--sombra-acento)`, `backdrop-filter: blur(...)`)
    - _Requisitos: 7.2, 9.3_

  - [x] 3.3 Definir `.titulo-tema` (sustituye `.videojuego-title`), `.texto-tema` (sustituye `.videojuego-text`) y `.texto-tema--condiciones` (sustituye `.videojuego-conditions`), con la tipografía definitiva del nuevo sistema de diseño (sustituyendo `Press Start 2P`/`VT323`/`Share Tech Mono`)
    - _Requisitos: 7.2_
    - _Nota: se usó `'Rajdhani', 'Segoe UI', system-ui, sans-serif` como pila tipográfica (fuente gaming moderna de trazo anguloso, coherente con el mockup, sin depender de que la fuente esté instalada localmente — con fallbacks del sistema). Si se desea la fuente exacta `Rajdhani` renderizada, quedaría pendiente añadir su `@font-face`/Google Fonts en una tarea futura; no bloquea esta feature porque los fallbacks ya son legibles y consistentes._

  - [x] 3.4 Definir `.boton-primario` (sustituye `.botonRegistro`): degradado `var(--color-acento)` → `var(--color-acento-secundario)`, estados `:hover`/`:focus-visible` anidados
    - _Requisitos: 1.7, 9.3, 9.4_

  - [x] 3.5 Definir la regla común de foco visible (`:focus-visible { outline: 2px solid var(--color-acento); }`) aplicada a enlaces, botones y controles interactivos
    - _Requisitos: 8.2_

  - [x] 3.6 Envolver las transiciones de color/transform de `.tarjeta-tema`, `.boton-primario` y demás elementos animados en `@media (prefers-reduced-motion: no-preference) { ... }`
    - _Requisitos: 8.4_
    - _Nota: implementado como mixin `transicion-suave($propiedades...)` reutilizado por `.tarjeta-tema` y `.boton-primario`, en vez de repetir el media query en cada regla._

---

- [x] 4. `src/globalState/themeContext.jsx` — ThemeProvider
  **Dependencias:** Task 2
  **Requisitos:** Req 1.2, 1.5, 2.1, 2.2, 2.3, 2.4

  - [x] 4.1 Implementar `ThemeContext` y `ThemeProvider` siguiendo el contrato de `design.md` (`useState` inicializado de forma síncrona con `readThemeFromStorage()`, `useLayoutEffect` aplicando `data-theme` al `<html>`, `toggleTheme` con `useCallback` que persiste en `localStorage['gg-theme']`)
    - `readThemeFromStorage()` valida contra el allowlist `['azul', 'rojo']`; cualquier otro valor usa `'azul'` por defecto
    - _Requisitos: 1.2, 1.5, 2.1, 2.2, 2.3_

  - [x] 4.2 Exportar el shape del contexto: `{ theme, toggleTheme }`
    - _Requisitos: 2.4_

  - [x]* 4.3 Escribir tests unitarios de `themeContext.jsx` (mismo patrón que `authContext.test.jsx`)
    - `ThemeProvider` aplica `data-theme="azul"` por defecto sin nada en localStorage
    - `ThemeProvider` aplica `data-theme="rojo"` si `localStorage.getItem('gg-theme') === 'rojo'`
    - Un valor corrupto en localStorage (`'purpura'`) hace que se use `'azul'`
    - `toggleTheme()` alterna el tema y actualiza `localStorage`
    - Cambiar de tema no borra `localStorage['session']` (independencia de Requisito 2.4); cerrar sesión no borra `localStorage['gg-theme']`
    - _Requisitos: 1.2, 1.5, 2.1, 2.3, 2.4_

---

- [x] 5. `src/hooks/useTheme.js`
  **Dependencias:** Task 4
  **Requisitos:** (infraestructura, mismo patrón que `useAuth.js`)

  - [x] 5.1 Implementar y exportar `useTheme()`: `useContext(ThemeContext)`, lanza `Error('useTheme debe usarse dentro de ThemeProvider')` si el contexto es `null`

---

### Phase 2 — Navbar genérico

---

- [x] 6. `NavbarComponente/ThemeToggle.jsx` — botón de cambio de tema
  **Dependencias:** Task 5
  **Requisitos:** Req 1.1, 1.2, 1.4

  - [x] 6.1 Implementar `ThemeToggle.jsx` según el contrato de `design.md`: botón con `onClick={toggleTheme}`, `aria-pressed={theme === 'rojo'}`, `aria-label` dinámico indicando el tema destino
    - _Requisitos: 1.2, 1.4_

  - [x] 6.2 Crear `ThemeToggle.scss` (icono/indicador visual del tema activo, usando `var(--color-acento)`)
    - _Requisitos: 1.1_
    - _Nota: se extrajo el mixin `transicion-suave` de `_shared.scss` a un nuevo parcial `src/styles/_mixins.scss` (usado por ambos), para que `ThemeToggle.scss`/`Navbar.scss` no tuvieran que tirar de las clases de `_shared.scss` solo para acceder al mixin — mantiene la separación de `design.md` (Navbar solo depende de tokens/mixins, no de las clases de página de Login/Registro/ErrorPage)._

  - [x]* 6.3 Escribir tests de `ThemeToggle.jsx`
    - Al hacer click invoca `toggleTheme`
    - `aria-pressed` refleja el tema activo
    - Es activable con teclado (Enter/Espacio) — usar `userEvent` para simular ambas teclas
    - _Requisitos: 1.2, 1.4_

---

- [x] 7. `NavbarComponente/Navbar.jsx` — componente genérico
  **Dependencias:** Task 6, Task 3
  **Requisitos:** Req 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.1, 4.2, 4.3, 4.4, 8.5

  - [x] 7.1 Implementar la estructura semántica base: `<header className="navbar"><nav>...</nav></header>` con el logotipo (`<img>` dentro de `Link to="/"`, `src` según `theme` — `/logo1.png` en `azul`, `/logo2.png` en `rojo`) y el contenedor de tamaño fijo con `object-fit: cover` para evitar la caja de fondo de `logo1.png` (Req 3.1)
    - _Requisitos: 3.1, 8.5_
    - _Nota: `object-position: 50% 32%` y `mix-blend-mode: screen` como primer ajuste; el recorte fino queda para el checkpoint visual (Task 12.4), tal como anticipaba la nota de `tasks.md`._

  - [x] 7.2 Añadir los enlaces de navegación: `Link to="/"` real para "Inicio"; `<span className="navbar__link navbar__link--proximamente" aria-disabled="true">` para "Juegos", "Novedades" y "Comunidad"
    - _Requisitos: 3.2, 3.3, 3.4_

  - [x] 7.3 Integrar `<ThemeToggle />` en el Navbar
    - _Requisitos: 3.5 (mismo conjunto de elementos en ambos temas)_

  - [x] 7.4 Implementar la zona de sesión: `isAuthenticated ? (username + botón "Cerrar sesión" → logout()) : (Link "Iniciar sesión" a /login + Link "Registrarse" a /registro con clase .boton-primario)`
    - _Requisitos: 4.1, 4.2, 4.3, 4.4_

  - [x] 7.5 Implementar el menú móvil: botón hamburguesa + panel colapsable con `useState` local, visible solo bajo el breakpoint de 768px definido en `Navbar.scss`, sin ocultar logotipo/ThemeToggle/zona de sesión
    - _Requisitos: 3.6_

  - [x] 7.6 Crear `Navbar.scss`: `position: sticky; top: 0;`, `background-color: var(--color-fondo-elevado)`, `backdrop-filter: blur(...)` (+ `-webkit-backdrop-filter`), `z-index` por encima del contenido, sin declarar colores de tema propios (solo `var(--color-*)`)
    - _Requisitos: 3.7, 3.8, 9.6_
    - _Nota (ajuste sobre `design.md`): `Navbar.scss` sí importa `_shared.scss` (además de `_mixins.scss`), para reutilizar literalmente la regla `.boton-primario` en "Registrarse" en vez de duplicarla — el diagrama de `design.md` lo mostraba conectado solo a `_tokens.scss`, pero el Requisito 9.8 pide explícitamente extraer a un parcial reutilizable los botones compartidos entre componentes en lugar de duplicar su CSS. Gracias al sistema de módulos de Sass (`@use`), la CSS de `_shared.scss` solo se emite una vez en el bundle final aunque varios ficheros la importen, así que no hay duplicación real en el CSS compilado._

  - [x]* 7.7 Escribir tests unitarios de `Navbar.jsx` (envolviendo en `MemoryRouter` + `AuthProvider` + `ThemeProvider`, mockeando `authService`)
    - Sin sesión: muestra "Iniciar sesión" y "Registrarse"
    - Con sesión (mockear `AuthContext` o loguear vía el mock de `authService`): muestra el `username` y el botón de cerrar sesión, y al pulsarlo se llama a `logout`
    - El logotipo cambia de `src` al pulsar `ThemeToggle`
    - Los enlaces "Juegos"/"Novedades"/"Comunidad" no son `<a>`/`<button>` navegables (verificar `aria-disabled`)
    - _Requisitos: 3.1, 3.4, 4.1, 4.2, 4.3_
    - _Nota: el Navbar todavía no es visible en la app real (no está conectado en ninguna ruta hasta la Phase 3, cuando exista `Home`); la verificación visual en navegador queda para el checkpoint de la Task 12.4._

---

### Phase 3 — Home: Hero, grid de juegos y enrutado

---

- [ ] 8. `zonaHome/GameCardComponente/GameCard.jsx`
  **Dependencias:** Task 2
  **Requisitos:** Req 6.2, 6.3, 6.4, 8.3

  - [ ] 8.1 Implementar `GameCard.jsx` con props `{ src, alt }`, estado local `error` y `onError` en el `<img>` que activa el fallback (`role="img"` + `aria-label={alt}`) según el contrato de `design.md`
    - _Requisitos: 6.2, 6.4, 8.3_

  - [ ] 8.2 Crear `GameCard.scss`: borde/resplandor con `var(--color-acento)` (Req 6.3), sin declarar color de tema propio
    - _Requisitos: 6.3, 9.6_

  - [ ]* 8.3 Escribir tests unitarios de `GameCard.jsx`
    - Renderiza la imagen con el `src`/`alt` recibidos
    - Al disparar `onError` en la imagen, muestra el fallback con el `alt` visible y dejar de renderizar el `<img>` roto
    - _Requisitos: 6.2, 6.4_

---

- [ ] 9. `zonaHome/GamesGridComponente/GamesGrid.jsx`
  **Dependencias:** Task 8
  **Requisitos:** Req 6.1, 6.5, 8.5

  - [ ] 9.1 Definir el array constante de 6 entradas `{ src: '/assassins.jpg', alt: '...' }` (ídem `blooddownwalker.jpg`, `dragonball.jpg`, `fc27.jpg`, `gta.jpg`, `wolverine.jpg`) con `alt` descriptivo por juego, y mapear a `<GameCard />` dentro de un `<section>` con encabezado `<h2>` para lectores de pantalla
    - _Requisitos: 6.1, 8.5_

  - [ ] 9.2 Crear `GamesGrid.scss`: grid de 3 columnas en escritorio, 1 columna bajo el breakpoint móvil (768px), manteniendo la proporción de cada portada
    - _Requisitos: 6.5_

  - [ ]* 9.3 Escribir test de `GamesGrid.jsx`: renderiza exactamente 6 `GameCard`
    - _Requisitos: 6.1_

---

- [ ] 10. `zonaHome/HeroSectionComponente/HeroSection.jsx`
  **Dependencias:** Task 5
  **Requisitos:** Req 5.2, 5.3, 5.4

  - [ ] 10.1 Implementar `HeroSection.jsx`: etiqueta "TENDENCIAS", `<h1>` "LO MÁS JUGADO", texto descriptivo, botón "Ver todos" como `<span aria-disabled="true">` (Req 5.4), e imagen de mando como `background-image` de `.hero__imagen-mando` según `theme` (`/mando.png` en azul, `/mando2.png` en rojo)
    - _Requisitos: 5.2, 5.3, 5.4_

  - [ ] 10.2 Crear `HeroSection.scss` consumiendo `var(--color-*)`
    - _Requisitos: 9.6_

  - [ ]* 10.3 Escribir test de `HeroSection.jsx`: la imagen de fondo cambia según el tema activo (mockear `useTheme`)
    - _Requisitos: 5.3_

---

- [ ] 11. `zonaHome/HomeComponente/Home.jsx`
  **Dependencias:** Task 7, Task 9, Task 10
  **Requisitos:** Req 5.1, 9.5

  - [ ] 11.1 Implementar `Home.jsx`: `<><Navbar /><main className="home"><HeroSection /><GamesGrid /></main></>`, sin lógica propia
    - _Requisitos: 5.1, 9.5_

  - [ ] 11.2 Crear `Home.scss` (layout general de la página, `var(--color-fondo)`)

  - [ ]* 11.3 Escribir test de integración de `Home.jsx`: renderiza Navbar, Hero y los 6 GameCard juntos (envolviendo en `MemoryRouter` + `AuthProvider` + `ThemeProvider`)
    - _Requisitos: 5.1_

---

- [ ] 12. Enrutado: `AppRouter.jsx` y `main.jsx`
  **Dependencias:** Task 11, Task 4
  **Requisitos:** Req 5.1, 5.5

  - [ ] 12.1 Modificar `AppRouter.jsx`: sustituir el `import Tienda` por `import Home from '../Componentes/zonaHome/HomeComponente/Home'`, y la ruta `/` pasa de `<ProtectedRoute><Tienda /></ProtectedRoute>` a `<Home />` directamente
    - _Requisitos: 5.1, 5.5_

  - [ ] 12.2 Eliminar `src/Componentes/zonaTienda/TiendaComponente/Tienda.jsx` (y la carpeta `zonaTienda/` si queda vacía)
    - _Requisitos: 5.5_

  - [ ] 12.3 Modificar `main.jsx`: envolver `<AuthProvider>` con `<ThemeProvider>` (orden: `BrowserRouter` > `ThemeProvider` > `AuthProvider` > `AppRouter`)
    - _Requisitos: (infraestructura, ver design.md → main.jsx)_

  - [ ] 12.4 Checkpoint — Arrancar `npm run dev` y verificar manualmente: `/` renderiza la Home sin redirigir a `/login` estando desconectado; el `ThemeToggle` cambia logotipo/mando/bordes de las 6 tarjetas de forma inmediata; recargar la página conserva el último tema elegido

---

### Phase 4 — Migración visual de Login, Registro, ErrorPage e InputBox

---

- [ ] 13. `InputBox.css` → `InputBox.scss`
  **Dependencias:** Task 2
  **Requisitos:** Req 7.5

  - [ ] 13.1 Renombrar `InputBox.css` a `InputBox.scss`; añadir estilos de borde/foco (`border-color: var(--color-acento)` en `:focus`) sustituyendo el foco azul por defecto de Bootstrap, sin modificar `InputBox.jsx` (mismo comportamiento `required`/truncado ya cubierto en `.specs/login-autenticacion/`)
    - _Requisitos: 7.5_

---

- [ ] 14. `ErrorPage.css` → `ErrorPage.scss` + `ErrorPage.jsx`
  **Dependencias:** Task 7, Task 3
  **Requisitos:** Req 9.2

  - [ ] 14.1 Renombrar `ErrorPage.css` a `ErrorPage.scss`, sustituyendo `.error-page-contenido`/`.error-page-codigo` por reglas anidadas que usen `.tarjeta-tema` y las variables de `_tokens.scss` en vez de los colores morados fijos actuales
    - _Requisitos: 9.2_

  - [ ] 14.2 Modificar `ErrorPage.jsx`: actualizar el import a `./ErrorPage.scss`, incluir `<Navbar />`, y sustituir `fondo-gaming`/`videojuego-title`/`videojuego-text`/`botonRegistro` por `.pagina-tematica`/`.titulo-tema`/`.texto-tema`/`.boton-primario`
    - _Requisitos: 9.2_

---

- [ ] 15. `Login.css` → `Login.scss` + `Login.jsx`
  **Dependencias:** Task 7, Task 3, Task 13
  **Requisitos:** Req 7.1, 7.2, 7.3, 9.2, 9.9

  - [ ] 15.1 Renombrar `Login.css` a `Login.scss`; mover/adaptar la regla de `[role='alert']` existente anidada dentro de la nueva estructura de `.tarjeta-tema`
    - _Requisitos: 9.2_

  - [ ] 15.2 Modificar `Login.jsx`: incluir `<Navbar />`, sustituir el div `fondo-gaming` + wrapper inline por `.pagina-tematica`/`.pagina-tematica__contenido`/`.tarjeta-tema`, y las clases `videojuego-title`/`videojuego-text`/`botonRegistro`/`contenido-registro`/`marginForm` por sus equivalentes de `_shared.scss`; actualizar el import de estilos a `./Login.scss`
    - Sin tocar el estado, `handleSubmit`, las llamadas a `authService` ni el manejo de errores/timeout/429 ya implementados
    - _Requisitos: 7.1, 7.2, 7.4, 9.9_

  - [ ] 15.3 Checkpoint manual — con `npm run dev`, verificar que `/login` se ve correctamente en ambos temas y que el `ThemeToggle` del Navbar actualiza la tarjeta del formulario de inmediato
    - _Requisitos: 7.3_

---

- [ ] 16. `Registro.css` → `Registro.scss` + `Registro.jsx`
  **Dependencias:** Task 7, Task 3, Task 13
  **Requisitos:** Req 7.1, 7.2, 7.3, 9.2, 9.9

  - [ ] 16.1 Renombrar `Registro.css` a `Registro.scss`, anidando `.botonRegistro`/`.videojuego-title`/etc. bajo sus nuevos nombres de `_shared.scss` (ver Task 15.1 como referencia de patrón)
    - _Requisitos: 9.2_

  - [ ] 16.2 Modificar `Registro.jsx`: incluir `<Navbar />`, aplicar el mismo reemplazo de clases que en Login.jsx (Task 15.2) a los dos `return` del componente (formulario y mensaje de éxito), y actualizar el import de estilos a `./Registro.scss`
    - Sin tocar el estado, `handleSubmit`, las llamadas a `authService.register` ni el manejo de errores 400/409/429/timeout ya implementados
    - _Requisitos: 7.1, 7.2, 7.4, 9.9_

  - [ ] 16.3 Checkpoint manual — con `npm run dev`, verificar que `/registro` (incluida la pantalla de éxito tras un registro real) se ve correctamente en ambos temas
    - _Requisitos: 7.3_

---

### Phase 5 — Actualizar tests existentes y checkpoint final

---

- [ ] 17. Envolver los tests existentes afectados con `ThemeProvider`
  **Dependencias:** Task 15, Task 16, Task 14, Task 4
  **Requisitos:** (evitar regresión de la suite ya verificada en `.specs/login-autenticacion/`)

  - [ ] 17.1 Modificar `Login.test.jsx`: el helper `renderLogin()` envuelve además con `<ThemeProvider>` (dentro de `MemoryRouter`, fuera o dentro de `AuthProvider` indistintamente); mockear `authService` sigue igual
    - Verificar que la Propiedad 12 (fast-check, espacios en blanco) sigue pasando con el árbol envuelto
    - _Requisitos: (regresión)_

  - [ ] 17.2 Modificar `Registro.test.jsx`: mismo cambio que 17.1 en su helper de render
    - _Requisitos: (regresión)_

  - [ ] 17.3 Modificar `authContext.test.jsx`: el `Probe`/`LoginProbe` y el resto de tests que rendericen `AuthProvider` junto a componentes que ahora requieren `ThemeContext` (si aplica tras 17.1) se revisan; si `authContext.test.jsx` no renderiza `Navbar`/`Login`/`Registro` directamente, no necesita cambios — confirmar antes de modificar
    - _Requisitos: (regresión)_

  - [ ] 17.4 Modificar `ErrorPage.test.jsx`: envolver con `<AuthProvider>` y `<ThemeProvider>` además del `MemoryRouter` ya existente, ya que `ErrorPage` pasa a incluir `<Navbar />` (Task 14.2)
    - _Requisitos: (regresión)_

  - [ ] 17.5 Ejecutar `npm test` en `GalinGames_react/` y confirmar que la suite completa (incluidas las Propiedades 12 y 16 ya existentes) sigue en verde
    - _Requisitos: (regresión)_

---

- [ ] 18. Checkpoint final — build, lint y revisión visual completa
  **Dependencias:** Task 17

  - [ ] 18.1 Ejecutar `npm run lint` y `npm run build` en `GalinGames_react/` sin errores ni warnings nuevos
  - [ ] 18.2 Con `npm run dev`, recorrer manualmente `/`, `/login`, `/registro` y una ruta de error (`/error/404`) en ambos temas, comprobando: Navbar fijo y semitransparente al hacer scroll, logotipo sin caja de fondo visible, bordes de tarjetas y botones acordes al tema, menú móvil funcional bajo 768px, y persistencia del tema tras recargar
  - [ ] 18.3 Verificar con las herramientas de accesibilidad del navegador (o `axe` si está disponible) que no aparecen problemas de contraste ni de foco visible en ninguno de los dos temas

---

## Notes

- Las sub-tareas marcadas con `*` son opcionales y pueden omitirse para una primera versión más rápida, igual que en `.specs/login-autenticacion/tasks.md`.
- El ajuste fino de `object-position`/escala del logotipo `logo1.png` (Task 7.1) y del recorte de `mando.png`/`mando2.png` en el Hero (Task 10.1) es visual y se termina de calibrar durante los checkpoints manuales (Tasks 12.4, 15.3, 16.3, 18.2), no analíticamente.
- Esta feature no toca el backend (`GalinGames_nodejs/`) ni ningún endpoint de `.specs/login-autenticacion/`.

---

## Task Dependency Graph

```mermaid
graph TD
    T1["Task 1: Instalar Sass"]
    T2["Task 2: _tokens.scss"]
    T3["Task 3: _shared.scss"]
    T4["Task 4: themeContext.jsx"]
    T5["Task 5: useTheme.js"]
    T6["Task 6: ThemeToggle"]
    T7["Task 7: Navbar"]
    T8["Task 8: GameCard"]
    T9["Task 9: GamesGrid"]
    T10["Task 10: HeroSection"]
    T11["Task 11: Home"]
    T12["Task 12: AppRouter + main.jsx"]
    T13["Task 13: InputBox.scss"]
    T14["Task 14: ErrorPage"]
    T15["Task 15: Login"]
    T16["Task 16: Registro"]
    T17["Task 17: Actualizar tests existentes"]
    T18["Task 18: Checkpoint final"]

    T1 --> T2
    T2 --> T3
    T2 --> T4
    T4 --> T5
    T5 --> T6
    T6 --> T7
    T3 --> T7
    T2 --> T8
    T8 --> T9
    T5 --> T10
    T7 --> T11
    T9 --> T11
    T10 --> T11
    T11 --> T12
    T4 --> T12
    T2 --> T13
    T7 --> T14
    T3 --> T14
    T7 --> T15
    T3 --> T15
    T13 --> T15
    T7 --> T16
    T3 --> T16
    T13 --> T16
    T15 --> T17
    T16 --> T17
    T14 --> T17
    T4 --> T17
    T17 --> T18
```

```json
{
  "waves": [
    { "wave": 1, "tasks": [1] },
    { "wave": 2, "tasks": [2] },
    { "wave": 3, "tasks": [3, 4, 8, 13] },
    { "wave": 4, "tasks": [5, 9] },
    { "wave": 5, "tasks": [6, 10] },
    { "wave": 6, "tasks": [7] },
    { "wave": 7, "tasks": [11, 14, 15, 16] },
    { "wave": 8, "tasks": [12] },
    { "wave": 9, "tasks": [17] },
    { "wave": 10, "tasks": [18] }
  ]
}
```
