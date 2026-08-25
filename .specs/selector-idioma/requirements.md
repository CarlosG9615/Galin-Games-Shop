# Requirements Document

## Introduction

Esta feature introduce internacionalización (i18n) en `GalinGames_react` mediante `react-i18next`, junto con un selector de idioma accesible en el `Navbar`. El idioma principal y por defecto de la aplicación es **español (`es`)**, ya que todo el contenido actual está escrito y programado en español. El usuario podrá cambiar a **inglés (`en`)** desde un botón/dropdown en el Navbar, de forma análoga al patrón ya existente para el cambio de tema (`ThemeToggle` + `ThemeContext` + `useTheme`).

Como parte de esta feature se migra **todo el texto visible actualmente hardcodeado** en los componentes de `GalinGames_react` a dos ficheros de traducción, `es.json` y `en.json`, consumidos vía `react-i18next`. Además, se actualiza `CLAUDE.md` para dejar constancia de que, a partir de esta feature, cualquier texto nuevo visible para el usuario debe añadirse como clave de traducción en dichos JSON en lugar de como texto plano en el JSX.

Quedan fuera de alcance: la traducción de datos que no son texto de interfaz (p. ej. los títulos de videojuegos en `GamesGrid`, que son nombres propios), y el backend (`GalinGames_nodejs`), cuyos mensajes de error/validación no se traducen en esta feature salvo que el frontend ya los sobrescriba con texto propio.

## Glossary

- **`LanguageProvider`**: componente de contexto (análogo a `ThemeProvider` en `src/globalState/themeContext.jsx`) que envuelve la aplicación en `main.jsx`, mantiene el idioma activo (`es` | `en`), lo persiste, y aplica el atributo `lang` sobre `document.documentElement`.
- **`useLanguage`**: hook (análogo a `useTheme` en `src/hooks/useTheme.js`) que expone el idioma activo y la función para cambiarlo, leyendo del `LanguageContext`.
- **`LanguageToggle`**: componente de botón en el `Navbar` (sustituye al bloque estático `<span className="navbar__idioma">` actual) que muestra el icono de globo (`IconoGlobo`) junto con el código del idioma activo, y al pulsarse despliega un dropdown accesible con las opciones "ES" y "EN".
- **`i18next` / `react-i18next`**: librerías de internacionalización que gestionan la carga de los ficheros de traducción y la función `t()`/hook `useTranslation()` para resolver claves de texto.
- **`es.json` / `en.json`**: ficheros de recursos de traducción, uno por idioma soportado, con las claves de todo el texto visible de la aplicación.
- **Idioma activo**: idioma actualmente aplicado a la página (`document.documentElement.lang`), inicialmente `es`.
- **Clave de traducción (translation key)**: identificador corto y descriptivo en inglés, con namespace por componente/sección (p. ej. `hero.discoverSubtitle`, `login.submitButton`), que actúa como puntero al texto — nunca el texto literal completo. El texto real (en español o inglés) vive únicamente como valor en `es.json`/`en.json`.

## Requirements

### Requisito 1: Idioma español por defecto

**User Story:** Como usuario que visita la tienda por primera vez, quiero que el contenido se muestre en español, para poder entender la página sin configuración adicional.

#### Criterios de Aceptación

1. WHEN un usuario carga la aplicación sin preferencia de idioma guardada previamente THEN el sistema DEBERÁ mostrar todo el texto de la interfaz en español.
2. WHEN la aplicación se inicializa THEN el `LanguageProvider` DEBERÁ establecer el atributo `lang="es"` sobre el elemento `<html>`.
3. THE sistema de traducción SHALL usar `es.json` como idioma de referencia (`fallbackLng`) para cualquier clave que no exista en otro idioma soportado.

### Requisito 2: Cambio de idioma a inglés

**User Story:** Como usuario que prefiere el inglés, quiero poder cambiar el idioma de la página, para navegar la tienda en el idioma que entiendo mejor.

#### Criterios de Aceptación

1. WHEN el usuario selecciona "EN" en el dropdown de idioma THEN el sistema DEBERÁ traducir todo el texto visible de la interfaz al inglés usando `en.json`.
2. WHEN el usuario cambia el idioma activo THEN el `LanguageProvider` DEBERÁ actualizar el atributo `lang` del elemento `<html>` al código de idioma correspondiente (`es` o `en`).
3. WHEN el usuario selecciona "ES" estando el idioma activo en inglés THEN el sistema DEBERÁ volver a mostrar todo el texto visible en español.
4. WHILE el usuario navega entre páginas de la aplicación (Home, Login, Registro, ErrorPage) THE sistema SHALL mantener el idioma seleccionado sin que se reinicie a español.
5. WHEN el usuario cambia el idioma THEN el sistema DEBERÁ persistir la preferencia (p. ej. `localStorage`, siguiendo el mismo patrón que `gg-theme` en `themeContext.jsx`) de forma que se recupere en visitas posteriores.
6. IF el valor de idioma persistido no es `es` ni `en` THEN el sistema DEBERÁ usar `es` como idioma por defecto.

### Requisito 3: Botón de idioma accesible en el Navbar

**User Story:** Como usuario, incluyendo quienes usan lector de pantalla o navegación por teclado, quiero identificar y operar el control de cambio de idioma, para poder cambiar el idioma sin depender del ratón ni de la vista.

#### Criterios de Aceptación

1. THE `LanguageToggle` SHALL sustituir al bloque estático actual `<span className="navbar__idioma" aria-disabled="true">` por un control interactivo (`<button>`) no deshabilitado.
2. THE `LanguageToggle` SHALL mostrar en todo momento el icono de globo (`IconoGlobo`) junto con el código del idioma actualmente activo (`ES` o `EN`).
3. WHEN el foco de teclado llega al botón `LanguageToggle` THEN el sistema DEBERÁ permitir abrir el dropdown con `Enter` o `Espacio`.
4. THE botón `LanguageToggle` SHALL exponer `aria-haspopup="true"` y `aria-expanded` reflejando si el dropdown está abierto o cerrado, siguiendo el mismo patrón de accesibilidad ya usado en el menú de usuario del Navbar (`navbar__menu-usuario`).
5. THE botón `LanguageToggle` SHALL tener un `aria-label` descriptivo y traducido (p. ej. "Cambiar idioma") que no dependa únicamente del icono.
6. WHEN el dropdown de idioma está abierto y el usuario pulsa `Escape`, o hace clic/toca fuera del componente THEN el sistema DEBERÁ cerrar el dropdown, replicando el comportamiento ya implementado para `navbar__menu-usuario` en `Navbar.jsx`.

### Requisito 4: Dropdown de selección de idioma

**User Story:** Como usuario, quiero ver claramente qué idioma está activo al abrir el selector, para no seleccionar por error el idioma que ya está aplicado.

#### Criterios de Aceptación

1. WHEN el usuario pulsa el botón `LanguageToggle` THEN el sistema DEBERÁ desplegar un dropdown con exactamente dos opciones: "ES" (Español) y "EN" (English).
2. THE opción del dropdown correspondiente al idioma actualmente activo SHALL mostrarse deshabilitada (no seleccionable) y marcada como tal para tecnología de asistencia (p. ej. `aria-disabled="true"` y/o `disabled`).
3. THE opción del dropdown correspondiente al idioma NO activo SHALL ser seleccionable y, al activarse, DEBERÁ disparar el cambio de idioma descrito en el Requisito 2.
4. WHEN el usuario selecciona un idioma en el dropdown THEN el sistema DEBERÁ cerrar el dropdown tras aplicar el cambio.
5. THE lista de opciones del dropdown SHALL exponerse con semántica de menú accesible (p. ej. `role="menu"` / `role="menuitem"` o lista de botones dentro de un contenedor con `aria-label` apropiado), coherente con el patrón ya usado en `navbar__dropdown`.

### Requisito 5: Migración de texto hardcodeado a claves de traducción

**User Story:** Como desarrollador del proyecto, quiero que todo el texto visible de la aplicación esté centralizado en ficheros de traducción, para poder mantener y ampliar los idiomas soportados sin tocar la lógica de los componentes.

#### Criterios de Aceptación

1. THE ficheros `es.json` y `en.json` SHALL contener una clave por cada cadena de texto visible actualmente hardcodeada en los componentes de `GalinGames_react`, incluyendo como mínimo: `Navbar` (enlaces, aria-labels, menú de usuario, utilidades "próximamente"), `ThemeToggle` (aria-label), `Login`, `Registro`, `BotonesSocial`, `ErrorPage` (títulos y mensajes por código de error), `InputBox` (labels/placeholders recibidos como props desde las páginas que lo usan), `HeroSection`, `GamesGrid` (título de sección) y `AppRouter` (texto de carga).
2. WHEN un componente migrado necesita mostrar texto THEN el sistema DEBERÁ resolverlo mediante `useTranslation()`/`t()` de `react-i18next`, y no mediante literales de texto en el JSX.
3. WHERE un texto incluye datos dinámicos (p. ej. "Vuelve a intentarlo en {retryCountdown} segundos.", el mensaje de éxito de registro con `username`/`email`, o los mensajes de error `ERROR_CONFIG` de `ErrorPage`) THE clave de traducción correspondiente SHALL soportar interpolación de variables mediante la sintaxis de `i18next` (p. ej. `{{variable}}`).
4. THE nombres propios de videojuegos en `GamesGrid`/`GameCard` (p. ej. "GTA", "FC 27") SHALL quedar excluidos de la migración a claves de traducción.
5. IF una clave de traducción solicitada no existe en el idioma activo ni en `es.json` (fallback) THEN el sistema DEBERÁ mostrar la propia clave en lugar de fallar o mostrar la pantalla en blanco, comportamiento por defecto de `i18next`.
6. THE claves de traducción SHALL escribirse en inglés, cortas y descriptivas del contenido/propósito del texto (p. ej. `hero.discoverSubtitle`), y NUNCA SHALL usar como clave el texto literal completo que representan (p. ej. NO `"Descubre lo que la comunidad está jugando ahora mismo.": "..."`).
7. THE claves de traducción SHALL organizarse con un namespace por componente o sección (prefijo antes del primer punto, p. ej. `navbar.*`, `login.*`, `registro.*`, `errorPage.*`, `hero.*`, `gamesGrid.*`, `languageToggle.*`, `common.*` para texto compartido entre varios componentes), de modo que la misma clave exista con idéntica estructura en `es.json` y `en.json`, difiriendo únicamente en el valor traducido.

### Requisito 6: Regla de proceso para nuevo texto (actualización de CLAUDE.md)

**User Story:** Como equipo que trabaja con Claude Code en este proyecto, quiero que quede documentada la obligación de usar claves de traducción para todo texto nuevo, para que futuras funcionalidades no reintroduzcan texto hardcodeado.

#### Criterios de Aceptación

1. THE fichero `CLAUDE.md` SHALL incorporar una sección que indique que cualquier texto visible para el usuario debe añadirse como clave nueva en `es.json` y `en.json`, y consumirse vía `react-i18next`, en lugar de escribirse como literal en el JSX.
2. WHERE se defina una nueva feature siguiendo la metodología spec-driven ya existente en `CLAUDE.md` THE regla de internacionalización SHALL aplicarse igualmente a los documentos de diseño y tareas generados a partir de ese momento (i.e. `design.md`/`tasks.md` de nuevas features deben contemplar las claves de traducción necesarias).
3. IF en una revisión de código se detecta texto plano visible sin pasar por `t()`/claves de traducción THEN DEBERÁ tratarse como una desviación de la convención documentada en `CLAUDE.md`.

### Requisito 7: Cambio de idioma sin recarga ni errores de consola

**User Story:** Como usuario, quiero que cambiar de idioma sea instantáneo y no rompa la página, para tener una experiencia fluida.

#### Criterios de Aceptación

1. WHEN el usuario cambia de idioma THEN el sistema DEBERÁ actualizar el texto visible sin recargar la página (sin `window.location.reload()` ni navegación completa).
2. IF `react-i18next` no ha terminado de inicializar los recursos de traducción al montar la aplicación THEN el sistema DEBERÁ evitar mostrar claves sin resolver o errores no controlados en consola durante el arranque.
3. THE cambio de idioma SHALL funcionar igual en todas las rutas donde el `Navbar` esté presente (`Home`, `ErrorPage`) y en las páginas que incluyen `ThemeToggle`/cabecera propia (`Login`, `Registro`), de modo que el idioma activo sea consistente entre páginas.
