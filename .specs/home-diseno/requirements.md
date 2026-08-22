# Requirements Document

## Introduction

Este documento describe los requisitos de la nueva página de inicio (Home) pública de GalinGames, construida a partir de las referencias visuales en `GalinGames_react/public/` (`markdowns.png`, `mando.png`, `mando2.png`, `logo1.png`, `logo2.png`, `letraLogo.jpg` y las seis portadas de juego). La Home introduce **dos temas visuales intercambiables** desde un botón en el navbar superior — un tema en tonos azul/violeta y un tema en tonos rojo/gris/negro — y se convierte en el **sistema de diseño general de la aplicación**: además de construir la Home en sí (navbar, hero "Lo más jugado" y grid de 6 juegos), este documento cubre adaptar visualmente las páginas de Login y Registro ya existentes (`Login.jsx`, `Registro.jsx`) para que abandonen su estética actual (fondo morado fijo `fondo-gaming`, tipografía pixel `Press Start 2P`) y pasen a usar la paleta, tipografía y componentes de tarjeta de los nuevos temas, respondiendo también al tema activo.

La Home sustituye al placeholder actual de `Tienda.jsx` en la ruta `/`, que pasa a ser **pública** (accesible sin sesión iniciada), mostrando en el navbar los enlaces de "Iniciar sesión"/"Registrarse" cuando no hay sesión, o el usuario autenticado con opción de cerrar sesión cuando sí la hay — sustituyendo así también la función que cumplía el placeholder de `Tienda.jsx`.

A nivel técnico, este documento cubre también dos decisiones estructurales explícitas: (1) la migración de las hojas de estilo CSS del proyecto a **SCSS** con anidación y una hoja de tokens de tema centralizada y con nombres descriptivos, de la que beben tanto los componentes nuevos como `Login.css`/`Registro.css`/`ErrorPage.css` ya existentes; y (2) la extracción del Navbar como **componente genérico independiente y reutilizable** (no acoplado a Home), con una separación de componentes clara para el resto de piezas nuevas (Hero, grid de juegos, tarjeta de juego) en lugar de concentrarlas en un único fichero.

Quedan fuera de alcance de este documento: el catálogo de juegos real, el carrito de compra, la lista de favoritos, las notificaciones y la búsqueda/selector de idioma funcionales — estos elementos, cuando aparecen en las referencias visuales, se especifican explícitamente como no funcionales en esta fase.

---

## Glossary

- **Home**: Nuevo componente React (sustituye a `Tienda.jsx` en la ruta `/`) que renderiza el navbar, la sección hero y el grid de 6 juegos.
- **Navbar**: Componente de cabecera superior, presente en Home (y reutilizado en Login/Registro), con logo, enlaces de navegación, controles de sesión y el botón de cambio de tema.
- **Theme_Context**: Nuevo estado global React (mismo patrón que `AuthContext`) que expone el tema activo (`azul` o `rojo`) y una función para alternarlo.
- **Tema Azul**: Paleta de referencia en tonos azul/violeta/cian, con `logo1.png` como logotipo y `mando.png` como imagen de mando del hero.
- **Tema Rojo**: Paleta de referencia en tonos rojo/gris/negro, con `logo2.png` como logotipo y `mando2.png` como imagen de mando del hero.
- **Selector_Tema**: Botón en el Navbar que alterna entre Tema Azul y Tema Rojo.
- **Hero_Section**: Bloque superior de la Home ("TENDENCIAS" / "LO MÁS JUGADO") con texto descriptivo, botón "Ver todos" y la imagen de mando grande del tema activo.
- **Grid_Juegos**: Cuadrícula de 6 tarjetas de juego bajo el Hero_Section, usando las imágenes `assassins.jpg`, `blooddownwalker.jpg`, `dragonball.jpg`, `fc27.jpg`, `gta.jpg` y `wolverine.jpg`.
- **GameCard**: Componente que renderiza una portada de juego dentro del Grid_Juegos, con borde/resplandor acorde al tema activo.
- **AuthContext**: Estado global de sesión ya existente (`src/globalState/authContext.jsx`), del que Home y Navbar consumen `isAuthenticated`, `user` y `logout`.
- **Login_Form / Register_Form**: Componentes ya existentes `Login.jsx` y `Registro.jsx`, cuya capa visual se adapta en este documento al sistema de diseño de los temas (sin tocar su lógica de validación, peticiones ni manejo de errores, ya cubiertos en `.specs/login-autenticacion/`).
- **ThemeToggle**: Componente ya existente (`NavbarComponente/ThemeToggle.jsx`) que renderiza el logotipo intercambiable del tema activo y alterna el tema al pulsarlo; normalmente vive dentro del Navbar, pero el Requisito 7bis lo reutiliza de forma independiente en Register_Form.
- **Imagen_Registro**: Imagen ilustrativa `downwalker-registro.jpg` (`GalinGames_react/public/`), mostrada junto al formulario de Register_Form (Requisito 7bis) y reutilizada también por Login_Form (Requisito 7ter.3), pese a su nombre de archivo.
- **Icono_Carrito**: Icono decorativo (sin funcionalidad todavía, patrón "próximamente") que sustituye al enlace "Iniciar sesión" en la zona de sesión del Navbar cuando no hay sesión iniciada (Requisito 4.1-4.2).
- **Icono_Usuario**: Icono sobre fondo circular semitransparente que sustituye al botón "Registrarse" en la zona de sesión del Navbar cuando no hay sesión iniciada, y que navega a `/login` al pulsarlo (Requisito 4.1, 4.3, 4.4). Reutiliza el icono SVG `IconoUsuario` ya existente en `NavbarIconos.jsx`.
- **Acceso_Social**: Fila de 4 botones circulares decorativos (Facebook, Google, Apple, Discord) mostrada únicamente en Login_Form, sin funcionalidad real (no existe backend de OAuth) — mismo patrón "próximamente" que el Icono_Carrito (Requisito 7ter.14).
- **Usuario**: Visitante de la tienda, autenticado o no.
- **Design_Tokens**: Hoja SCSS centralizada que define, para cada tema, las variables de color de acento, borde, fondo y estado (hover/focus) usadas por el resto de componentes — ningún componente SHALL declarar un color de tema "a mano" fuera de esta hoja.
- **HeroSection**: Componente que renderiza el bloque "TENDENCIAS" / "LO MÁS JUGADO" con la imagen de mando del tema activo.
- **GamesGrid**: Componente que renderiza el conjunto de 6 GameCard.
- **SCSS**: Preprocesador CSS (Sass, sintaxis `.scss`) usado en este documento para anidar selectores y organizar los Design_Tokens; se compila a CSS estándar en el build de Vite.

---

## Requirements

### Requisito 1: Selector de tema visual

**User Story:** Como usuario, quiero poder alternar entre el diseño en tonos azules y el diseño en tonos rojos desde el navbar, para elegir la estética que prefiero mientras navego por la tienda.

#### Criterios de Aceptación

1. THE Navbar SHALL mostrar un Selector_Tema visible en la cabecera superior, presente tanto en Home como en Login_Form y Register_Form.
2. WHEN el usuario activa el Selector_Tema, THE Theme_Context SHALL alternar el tema activo entre Tema Azul y Tema Rojo.
3. WHEN el tema activo cambia, THE Sistema SHALL actualizar de forma inmediata (sin recargar la página) el logotipo, la imagen de mando del Hero_Section, la paleta de colores de acento y los bordes/resplandores de las tarjetas en todos los componentes visibles.
4. THE Selector_Tema SHALL ser accesible por teclado (activable con Enter/Espacio al recibir foco) y SHALL exponer mediante `aria-label` o `aria-pressed` cuál es el tema actualmente activo.
5. IF no existe ningún tema guardado previamente, THEN THE Sistema SHALL usar el Tema Azul como tema por defecto.
6. WHILE el Tema Azul está activo, THE Sistema SHALL usar exclusivamente el color de borde/acento azul definido en los Design_Tokens para bordes de tarjetas, botones primarios y elementos de foco/hover — sin mezclar tonos del Tema Rojo. WHILE el Tema Rojo está activo, THE Sistema SHALL aplicar la misma regla con el color de borde/acento rojo, sin excepciones por componente.
7. THE botones primarios (por ejemplo, "Registrarse", "Ver todos", envío de Login_Form/Register_Form) SHALL cambiar su color de fondo/borde según el tema activo usando los mismos Design_Tokens que el resto de la interfaz, en lugar de un color fijo independiente del tema.

---

### Requisito 2: Persistencia del tema elegido

**User Story:** Como usuario, quiero que la aplicación recuerde el tema que elegí, para no tener que volver a seleccionarlo cada vez que visito la tienda.

#### Criterios de Aceptación

1. WHEN el usuario cambia de tema, THE Theme_Context SHALL guardar la elección en `localStorage` bajo una clave propia (independiente de la sesión de autenticación).
2. WHEN la aplicación arranca, THE Theme_Context SHALL leer el tema guardado en `localStorage` y aplicarlo antes de que el contenido visible se renderice con el tema por defecto, evitando parpadeos visibles de un tema a otro.
3. IF el valor guardado en `localStorage` para el tema no es `azul` ni `rojo` (por ejemplo, está corrupto o fue editado manualmente), THEN THE Theme_Context SHALL descartarlo y usar el Tema Azul por defecto, sin lanzar errores visibles al usuario.
4. THE valor persistido del tema SHALL ser independiente del `Session_Store` de autenticación: cambiar de tema NO SHALL cerrar la sesión del usuario, y cerrar sesión NO SHALL restablecer el tema elegido.

---

### Requisito 3: Navbar con logotipo y navegación

**User Story:** Como usuario, quiero un navbar superior con el logotipo de la tienda y los enlaces principales, para orientarme dentro de la aplicación.

#### Criterios de Aceptación

1. THE Navbar SHALL mostrar el logotipo correspondiente al tema activo (`logo1.png` en Tema Azul, `logo2.png` en Tema Rojo) de forma grande y claramente visible — pudiendo desbordar visualmente el borde inferior de la barra del Navbar —, sin recortes bruscos ni cajas de fondo visibles distintas del propio navbar, independientemente de que el archivo de origen tenga fondo transparente o no.
2. THE Navbar SHALL mostrar los enlaces de navegación "Inicio", "Juegos", "Novedades" y "Comunidad".
3. WHEN el usuario pulsa el enlace "Inicio", THE Sistema SHALL navegar a la ruta `/` sin recargar la página completa.
4. IF los enlaces "Juegos", "Novedades" y "Comunidad" no tienen todavía una página funcional asociada, THEN THE Navbar SHALL mostrarlos de forma visual y consistente en ambos temas sin provocar errores de navegación ni enlazar a rutas inexistentes (por ejemplo, quedando inertes o marcados como próximamente).
5. THE Navbar SHALL mantener el mismo conjunto de elementos (logotipo, enlaces de navegación, Selector_Tema y zona de sesión del Requisito 4) en ambos temas, sin incluir iconos de carrito, favoritos o notificaciones, dado que esas funcionalidades no existen todavía en la aplicación.
6. WHERE el ancho de la ventana es igual o inferior a un breakpoint móvil (768px), THE Navbar SHALL colapsar los enlaces de navegación en un menú accesible (por ejemplo, tipo hamburguesa) sin ocultar el logotipo, el Selector_Tema ni el acceso a inicio de sesión/registro o al usuario autenticado.
6.1. WHERE el ancho de la ventana está entre el breakpoint móvil y un breakpoint intermedio mayor (donde el logotipo grande, los enlaces de categorías y la zona de sesión ya no caben en una sola fila, pero todavía no hace falta colapsarlo todo), THE Navbar SHALL sustituir únicamente los enlaces de navegación por un icono de tres líneas centrado, manteniendo visibles el logotipo, la búsqueda, el selector de idioma y la zona de sesión en su fila habitual.
7. THE Navbar SHALL permanecer fijo en la parte superior del viewport durante el scroll de la página (posición `sticky`/`fixed`), permaneciendo visible en todo momento independientemente de la dirección del scroll.
8. THE Navbar SHALL aplicar un fondo semitransparente (no opaco) que permita distinguir, de forma difuminada, el contenido que se desplaza por debajo suyo mientras permanece fijo.
9. THE Navbar SHALL implementarse como un componente React genérico e independiente (no acoplado a Home ni a ningún otro componente concreto), importado tanto por Home como por Login_Form y Register_Form, de forma que su lógica y estilos vivan en un único lugar reutilizado por los tres.
10. THE Navbar SHALL mostrar, junto a la zona de sesión, un icono de búsqueda y un selector de idioma ("ES" con icono de globo) como elementos visuales sin funcionalidad todavía (mismo patrón "próximamente" del Requisito 3.4), separados de la zona de sesión por un divisor vertical decorativo — igual que en las referencias visuales de `markdowns.png`.

---

### Requisito 4: Zona de sesión en el Navbar

**User Story:** Como visitante, quiero acceder al inicio de sesión de forma rápida mediante iconos reconocibles, y como usuario ya autenticado quiero ver mi nombre de usuario y poder cerrar sesión, para gestionar mi acceso a la tienda sin salir del flujo de navegación.

#### Criterios de Aceptación

1. WHILE no hay sesión iniciada (`isAuthenticated` es `false`), THE Navbar SHALL mostrar en la zona de sesión un icono de carrito y un icono de usuario, en lugar de los enlaces de texto "Iniciar sesión"/"Registrarse" anteriores.
2. THE icono de carrito del criterio 4.1 SHALL ser puramente visual y sin funcionalidad todavía, siguiendo el mismo patrón "próximamente" de elementos inertes ya definido en el Requisito 3.4 (sin `onClick`, marcado como no interactivo).
3. THE icono de usuario del criterio 4.1 SHALL mostrarse sobre un fondo circular semitransparente (mismo tratamiento visual que el botón "X" del Requisito 7bis.12), a modo de avatar de usuario.
4. WHEN el usuario pulsa el icono de usuario (sin sesión iniciada), THE Sistema SHALL navegar a `/login`.
5. ~~WHILE hay sesión iniciada..., THE Navbar SHALL mostrar el `username`... y el botón "Cerrar sesión" exactamente igual que hasta ahora~~ — **SUPERSEDED por el criterio 5bis**: la zona de sesión pasa a mostrar los mismos dos iconos (carrito + usuario) tanto con sesión iniciada como sin ella.
5bis. WHILE hay sesión iniciada (`isAuthenticated` es `true`), THE Navbar SHALL mostrar exactamente los mismos dos iconos que sin sesión (carrito inerte + icono de usuario circular) — sin `username` visible como texto y sin el botón "Cerrar sesión" independiente de las versiones anteriores de este requisito.
5ter. WHEN el usuario pulsa el icono de usuario CON sesión iniciada, THE Navbar SHALL abrir un menú desplegable (en vez de navegar a `/login`, comportamiento reservado al estado sin sesión) con las opciones "Soporte", "Mi cuenta", "Mis pedidos" y "Cerrar sesión".
5quater. "Soporte", "Mi cuenta" y "Mis pedidos" del criterio 5ter SHALL ser elementos inertes sin funcionalidad todavía, mismo patrón "próximamente" del Requisito 3.4 — no existen esas páginas todavía.
6. WHEN el usuario autenticado activa la opción "Cerrar sesión" del menú desplegable, THE Sistema SHALL invocar `logout()` del AuthContext, cerrar el menú desplegable, y permanecer en la página actual si es pública, o redirigir a `/login` si la página requiere sesión.
6bis. WHEN el menú desplegable de usuario está abierto y el usuario pulsa fuera de él o la tecla Escape, THE Navbar SHALL cerrarlo.
7. THE Navbar SHALL aplicar los mismos estilos de la zona de sesión (colores, tipografía) en ambos temas, cambiando únicamente la paleta de acento.

> **Nota de alcance:** los criterios 4.1 y 4.5 (versión anterior de este requisito) describían un enlace de texto "Iniciar sesión" con icono decorativo y un botón "Registrarse" independiente. Quedan sustituidos por los criterios 4.1-4.4 anteriores: un único icono de usuario cubre ahora el acceso a Login_Form (que a su vez enlaza a Register_Form, Requisito 7ter.10), y el botón "Registrarse" desaparece de la zona de sesión del Navbar.
> **Segunda nota de alcance:** el usuario pidió explícitamente, tras ver el resultado de los criterios 1-4 en funcionamiento, que el estado autenticado usara "exactamente los mismos iconos" que el estado sin sesión, sustituyendo el criterio 4.5 original (username + botón "Cerrar sesión" en texto) por los criterios 5bis-5quater y 6bis (menú desplegable). "Mi cuenta"/"Mis pedidos"/"Soporte" son ideas de secciones futuras de cuenta de usuario, no cubiertas por ningún otro Requisito de este documento ni de `.specs/login-autenticacion/` — se documentan aquí únicamente como elementos de interfaz inertes.

---

### Requisito 5: Home pública con Hero "Lo más jugado"

**User Story:** Como visitante (con o sin sesión iniciada), quiero ver una página de inicio atractiva con lo más jugado del momento, para hacerme una idea rápida del catálogo de la tienda sin necesidad de registrarme antes.

#### Criterios de Aceptación

1. WHEN cualquier usuario (autenticado o no) accede a la ruta `/`, THE Sistema SHALL renderizar la Home completa sin redirigir a `/login`.
2. THE Hero_Section SHALL mostrar el título "LO MÁS JUGADO", un texto descriptivo y un botón "Ver todos" — sin la etiqueta "TENDENCIAS", que pertenece al Grid_Juegos (Requisito 6.6).
3. THE Hero_Section SHALL mostrar la imagen de mando correspondiente al tema activo (`mando.png` en Tema Azul, `mando2.png` en Tema Rojo).
4. IF el catálogo real de juegos no existe todavía como página navegable, THEN el botón "Ver todos" SHALL mostrarse de forma visual y consistente en ambos temas sin provocar un error de navegación al pulsarlo (por ejemplo, quedando inerte o marcado como próximamente), de forma análoga al Requisito 3.4.
5. THE ruta `/` SHALL dejar de estar protegida por `ProtectedRoute`; el componente `Tienda.jsx` y su lógica de bienvenida/logout quedan sustituidos por la Home y por la zona de sesión del Navbar (Requisito 4).

---

### Requisito 6: Grid de 6 juegos

**User Story:** Como visitante, quiero ver un grid con varias portadas de juegos destacados, para descubrir contenido de la tienda de un vistazo.

#### Criterios de Aceptación

1. THE Grid_Juegos SHALL renderizar exactamente 6 GameCard, usando en orden las imágenes `assassins.jpg`, `blooddownwalker.jpg`, `dragonball.jpg`, `fc27.jpg`, `gta.jpg` y `wolverine.jpg` desde `GalinGames_react/public/`.
2. THE GameCard SHALL incluir un atributo `alt` descriptivo para cada imagen, independiente del tema activo.
3. WHEN el tema activo cambia, THE GameCard SHALL actualizar únicamente el color de borde/resplandor decorativo, manteniendo la misma imagen de portada.
4. IF una imagen de portada no puede cargarse (por ejemplo, archivo movido o eliminado), THEN THE GameCard SHALL mostrar un estado de reserva (color de fondo sólido y el `alt` visible) en lugar de un icono de imagen rota, sin romper el layout del resto del grid.
5. WHERE el ancho de la ventana es igual o inferior a un breakpoint móvil (768px), THE Grid_Juegos SHALL reorganizarse en una sola columna manteniendo la proporción de cada portada.
6. THE Grid_Juegos SHALL mostrar la etiqueta "TENDENCIAS ›" como título de su propia sección (elemento `<h2>`), en el mismo contenedor padre que las 6 GameCard, posicionado debajo del Hero_Section — no como parte del Hero_Section (corrige el Requisito 5.2 original, donde "TENDENCIAS" aparecía agrupado con "LO MÁS JUGADO").

---

### Requisito 7: Sistema de diseño aplicado a Login

**User Story:** Como usuario, quiero que la página de inicio de sesión tenga la misma identidad visual que el resto de la tienda, para percibir una experiencia coherente en toda la aplicación.

#### Criterios de Aceptación

1. THE Login_Form SHALL incluir el Navbar del Requisito 3, con el Selector_Tema y la zona de sesión visibles igual que en Home.
2. THE Login_Form SHALL sustituir el fondo `fondo-gaming` (imagen fija morada) y la tipografía `Press Start 2P`/`VT323`/`Share Tech Mono` actuales por la paleta de color y la tipografía definidas para el Tema Azul/Tema Rojo en `design.md`.
3. WHEN el tema activo cambia estando en `/login`, THE Login_Form SHALL actualizar su apariencia (colores de tarjeta, botones, bordes) de forma inmediata, igual que la Home.
4. THE Login_Form SHALL conservar sin cambios toda su lógica ya implementada (validación de campos, llamadas a `authService`, manejo de errores 400/401/429/timeout, cuenta atrás de reintento, navegación tras éxito) — este requisito cubre exclusivamente la capa visual.
5. THE componente `InputBox` reutilizado por Login_Form y Register_Form SHALL adaptar su estilo visual (fondo, borde, color de foco) al tema activo sin cambiar su comportamiento (`required`, truncado de longitud máxima) ya cubierto en `.specs/login-autenticacion/`. THE campo SHALL usar un fondo oscuro acorde a `--color-fondo-elevado` con un borde claramente visible (no el blanco plano de Bootstrap por defecto), de forma que se distinga sin depender únicamente del color de foco.

> **Nota de alcance (SUPERSEDED):** este Requisito 7 cubrió originalmente tanto Login_Form como Register_Form con el mismo diseño (Navbar + tarjeta centrada), y así se implementó en la Phase 4 de `tasks.md`. Register_Form recibió primero un layout propio (**Requisito 7bis**) y, a continuación, Login_Form recibe el mismo tratamiento (**Requisito 7ter**): ningún formulario usa ya el patrón "Navbar + tarjeta" descrito aquí. Los criterios 7.1-7.4 quedan íntegramente sustituidos por 7ter.1-7ter.11; el criterio 7.5 (estilo de `InputBox`) se mantiene vigente, común a ambos formularios. Este Requisito 7 se conserva sin borrar por trazabilidad histórica de la Phase 4 ya implementada y verificada.

---

### Requisito 7bis: Layout dividido de Register_Form (formulario + imagen)

**User Story:** Como usuario, quiero un formulario de registro más directo y visual, con el logotipo intercambiable como única cabecera y una imagen ilustrativa junto al formulario, para una experiencia de registro más inmersiva y menos recargada que el resto de páginas con Navbar completo.

#### Criterios de Aceptación

1. THE Register_Form SHALL prescindir del Navbar genérico (Requisito 3) por completo, sin enlaces de navegación ni zona de sesión visibles en esta página.
2. THE Register_Form SHALL mostrar únicamente el ThemeToggle (logotipo intercambiable) anclado en la esquina superior izquierda de la página, reutilizando el mismo componente `ThemeToggle` ya usado por el Navbar (sin duplicar su implementación en un componente nuevo) y conservando su comportamiento de alternar y persistir el tema (Requisitos 1, 2).
3. THE Register_Form SHALL organizar la página, en pantallas de escritorio, en dos mitades de anchura aproximadamente igual (50/50): la mitad izquierda con el formulario de registro pegado a la esquina izquierda (alineado a la izquierda, no centrado ni en tarjeta), y la mitad derecha ocupada por la Imagen_Registro (`downwalker-registro.jpg`).
4. THE formulario de Register_Form SHALL renderizarse directamente sobre el fondo temático principal (Design_Tokens del tema activo), sin tarjeta, borde ni fondo elevado visible que lo delimite — a diferencia de `.tarjeta-tema`, usada en Login_Form y ErrorPage.
5. THE campos de Register_Form (username, nombre, apellidos, email, password, repetirPassword) SHALL prescindir de una etiqueta visible por encima de cada campo; en su lugar, cada campo SHALL mostrar como `placeholder` dentro del propio input una palabra o frase corta y directa (por ejemplo "Email", "Contraseña", "Repetir contraseña"), sin frases largas de relleno como "Introduce tu ... aquí".
6. IF se elimina la etiqueta visible de un campo, THEN THE campo SHALL conservar un nombre accesible equivalente para lectores de pantalla (por ejemplo mediante `aria-label`), sin perder accesibilidad respecto al Requisito 8.
7. WHERE el ancho de la ventana es igual o inferior a un breakpoint móvil, THE Register_Form SHALL apilar verticalmente el formulario y la Imagen_Registro (uno encima del otro) en lugar de mantener el layout 50/50, manteniendo el formulario completo y legible.
8. WHEN el tema activo cambia estando en Register_Form, THE Register_Form SHALL actualizar de forma inmediata el logotipo del ThemeToggle y la paleta de color de fondo/acento de la página (Requisito 1.3).
9. THE Register_Form SHALL conservar sin cambios toda su lógica ya implementada (validación de campos, llamadas a `authService.register`, manejo de errores 400/409/429/timeout, mensaje de éxito, navegación tras éxito) — este requisito cubre exclusivamente la capa visual.
10. THE Imagen_Registro SHALL tratarse como puramente decorativa a nivel de accesibilidad (por ejemplo, aplicada como imagen de fondo CSS en vez de `<img>`, sin necesidad de `alt`) — sin que este tratamiento oculte o interfiera con el botón "X" del criterio 7bis.12, que sí SHALL ser accesible por teclado y lectores de pantalla (Requisito 8.3).
11. THE enlace "¿Ya tienes cuenta? Inicia sesión" ya existente en Register_Form SHALL seguir presente y funcional, como vía de vuelta a Login_Form dentro de esta página.
12. THE Register_Form SHALL mostrar, en la esquina superior derecha de la Imagen_Registro, un botón con forma de "X" y fondo redondeado semitransparente que navegue a `/` (Home) al pulsarlo.
13. THE Register_Form SHALL mostrar, debajo del botón "Registrarse", un enlace "‹ Volver al inicio" que navegue a `/` (Home) al pulsarlo.
14. THE botón "X" del criterio 7bis.12 y el enlace "‹ Volver al inicio" del criterio 7bis.13 SHALL ser accesibles por teclado y SHALL exponer un nombre accesible descriptivo (por ejemplo `aria-label="Volver al inicio"` en el botón "X", cuyo contenido visual es solo el símbolo "X").
15. ~~THE Register_Form SHALL mostrar, entre el título y el primer campo, la fila de Acceso_Social...~~ — **retirado**: Register_Form NO muestra Acceso_Social (la referencia de esa pantalla concreta no lo incluía); queda solo en Login_Form (Requisito 7ter.14). Register_Form conserva únicamente sus campos, checkboxes, botón y enlaces ya descritos en los criterios 1-14.

---

### Requisito 7ter: Layout dividido de Login_Form (calcado de Register_Form)

**User Story:** Como usuario, quiero acceder al inicio de sesión con el mismo diseño directo y visual que el registro, para tener una experiencia coherente entre ambos formularios de acceso a la cuenta.

#### Criterios de Aceptación

1. THE Login_Form SHALL prescindir del Navbar genérico (Requisito 3) por completo, igual que Register_Form (Requisito 7bis.1).
2. THE Login_Form SHALL mostrar únicamente el ThemeToggle anclado en la esquina superior izquierda de la página, reutilizando el mismo componente ya usado por el Navbar y por Register_Form, sin duplicar su implementación (igual que 7bis.2).
3. THE Login_Form SHALL organizar la página, en pantallas de escritorio, en dos mitades de anchura aproximadamente igual (50/50): la mitad izquierda con el formulario pegado a la esquina izquierda, y la mitad derecha ocupada por la Imagen_Registro (`downwalker-registro.jpg`), reutilizando la misma imagen que Register_Form.
4. THE formulario de Login_Form SHALL renderizarse directamente sobre el fondo temático principal, sin tarjeta, borde ni fondo elevado visible que lo delimite, igual que Register_Form (7bis.4).
5. THE campos "Nombre de usuario" y "Contraseña" de Login_Form SHALL prescindir de una etiqueta visible por encima de cada campo, mostrando como `placeholder` una palabra o frase corta y directa, igual que Register_Form (7bis.5).
6. IF se elimina la etiqueta visible de un campo, THEN THE campo SHALL conservar un nombre accesible equivalente para lectores de pantalla, sin perder accesibilidad respecto al Requisito 8 (igual que 7bis.6).
7. WHERE el ancho de la ventana es igual o inferior a un breakpoint móvil, THE Login_Form SHALL apilar verticalmente el formulario y la Imagen_Registro, igual que Register_Form (7bis.7).
8. WHEN el tema activo cambia estando en Login_Form, THE Login_Form SHALL actualizar de forma inmediata el logotipo del ThemeToggle y la paleta de color de fondo/acento de la página (Requisito 1.3).
9. THE Login_Form SHALL conservar sin cambios toda su lógica ya implementada (validación de campos, llamadas a `authService.login`, manejo de errores 401/429/timeout, cuenta atrás de reintento, banner de email verificado, navegación tras éxito) — este requisito cubre exclusivamente la capa visual.
10. THE Login_Form SHALL mostrar, debajo del botón de envío ("Entrar"), dos enlaces en este orden: "¿Has olvidado tu contraseña?" y "¿Aún no tienes cuenta?". El enlace "¿Aún no tienes cuenta?" SHALL navegar a `/registro` (sustituye textualmente al enlace "¿No tienes cuenta? Regístrate" ya existente, conservando su destino).
11. IF no existe todavía un flujo de recuperación de contraseña implementado, THEN THE enlace "¿Has olvidado tu contraseña?" SHALL mostrarse de forma visual y consistente en ambos temas sin provocar un error de navegación al pulsarlo, siguiendo el mismo patrón "próximamente" de elementos inertes ya definido en el Requisito 3.4.
12. THE Login_Form SHALL mostrar el botón "X" (esquina superior derecha de la Imagen_Registro, fondo redondeado semitransparente) y el enlace "‹ Volver al inicio" (junto a los enlaces del criterio 7ter.10), ambos navegando a `/`, igual que Register_Form (Requisitos 7bis.12, 7bis.13).
13. THE botón "X" y el enlace "‹ Volver al inicio" de Login_Form SHALL ser accesibles por teclado y SHALL exponer un nombre accesible descriptivo, igual que en Register_Form (7bis.14).
14. THE Login_Form SHALL mostrar, entre el título y el primer campo, la misma fila de Acceso_Social del Requisito 7bis.15 (Facebook, Google, Apple, Discord) seguida del separador "o".
15. THE dos enlaces del criterio 7ter.10 ("¿Aún no tienes cuenta?" y "¿Has olvidado tu contraseña?") SHALL mostrarse uno junto al otro en la misma fila (no apilados), a diferencia del resto de enlaces sueltos de Login_Form/Register_Form.
16. THE banner de email verificado del criterio 7ter.9 SHALL mostrarse en color verde (distinto del color de texto/error habitual, independiente del tema activo) mientras esté visible.
17. WHEN el banner de email verificado lleva 60 segundos visible, THE Login_Form SHALL ocultarlo automáticamente sin intervención del usuario.

---

### Requisito 8: Accesibilidad y buenas prácticas de diseño web

**User Story:** Como usuario de cualquier capacidad, quiero poder navegar y usar la Home con teclado y lector de pantalla, para acceder a la tienda independientemente de cómo interactúe con el navegador.

#### Criterios de Aceptación

1. THE Sistema SHALL mantener una relación de contraste de al menos 4.5:1 entre el texto y su fondo en ambos temas, para el texto de cuerpo y los botones principales.
2. THE Navbar, EL Selector_Tema, los enlaces de navegación y los botones de sesión SHALL mostrar un indicador de foco visible al navegar con teclado (Tab).
3. THE imágenes decorativas (fondos, resplandores) SHALL usar `alt=""` o `aria-hidden="true"`, mientras que las imágenes con significado (logotipo, portadas de juego) SHALL llevar un `alt` descriptivo.
4. WHERE el usuario tiene activada la preferencia del sistema `prefers-reduced-motion`, THE Sistema SHALL reducir o eliminar las transiciones/animaciones decorativas del cambio de tema y de las tarjetas.
5. THE estructura HTML de la Home SHALL usar landmarks semánticos (`<header>`/`<nav>` para el Navbar, `<main>` para el contenido, encabezados `<h1>`/`<h2>` jerárquicos) en lugar de únicamente `<div>` genéricos.

---

### Requisito 9: Arquitectura de estilos (SCSS) y separación de componentes

**User Story:** Como desarrollador, quiero que los estilos estén organizados en SCSS anidado con nombres descriptivos y que cada pieza visual sea un componente independiente, para poder mantener y extender el diseño sin tener que tocar ficheros gigantes ni duplicar colores de tema.

#### Criterios de Aceptación

1. THE Sistema SHALL incorporar Sass como dependencia de desarrollo del frontend y usar la extensión `.scss` para toda hoja de estilos nueva o modificada por esta feature.
2. THE hojas de estilo ya existentes que esta feature modifica (`Login.css`, `Registro.css`, `ErrorPage.css`, y cualquier otra tocada por los Requisitos 1-8) SHALL convertirse a `.scss`, aplicando anidación de selectores donde exista relación padre-hijo o estado (`:hover`, `:focus`, media queries) en lugar de selectores planos repetidos.
3. THE Sistema SHALL centralizar los Design_Tokens de ambos temas en un único fichero SCSS (por ejemplo `_temas.scss` o equivalente), con nombres de variable descriptivos (por ejemplo `$color-borde-azul`, `$color-acento-rojo`) en lugar de nombres ambiguos como los ya existentes `color-fondo` o `marginForm`.
4. THE clases CSS definidas para esta feature SHALL seguir una convención de nombres descriptiva y consistente (por ejemplo BEM: `.navbar__logo`, `.game-card__borde`) que identifique el componente y el elemento sin necesidad de leer el HTML.
5. THE Sistema SHALL implementar Home, Navbar, HeroSection, GamesGrid y GameCard como componentes React independientes, cada uno en su propio fichero `.jsx` (y su propio `.scss` cuando tenga estilos propios), en lugar de concentrar el marcado y los estilos de varias piezas visuales en un único componente Home.
6. THE Navbar, HeroSection, GamesGrid y GameCard SHALL consumir los Design_Tokens del Requisito 9.3 para cualquier color dependiente del tema, sin declarar colores de tema propios ni duplicados dentro de su propio fichero de estilos.
7. THE fichero `.scss` de cada componente (nuevo o ya existente y convertido) SHALL vivir en la misma carpeta que su `.jsx` correspondiente y SHALL anidar únicamente las reglas propias de ese componente (su raíz, sus elementos hijos, sus estados y sus media queries), sin reglas sueltas de otros componentes ni duplicación del bloque de Design_Tokens.
8. IF el volumen de reglas de un componente crece hasta incluir estilos que también usan otros componentes (por ejemplo, tarjetas o botones compartidos), THEN esas reglas compartidas SHALL extraerse a un parcial SCSS reutilizable (por ejemplo bajo una carpeta `styles/` compartida) en lugar de duplicarse o acumularse dentro del fichero de un único componente.
9. THE ficheros `.jsx` que importan una hoja de estilos convertida de `.css` a `.scss` en esta feature (`Login.jsx`, `Registro.jsx`, `ErrorPage.jsx`, y cualquier otro tocado por los Requisitos 1-8) SHALL actualizar su sentencia de import para apuntar al nuevo fichero `.scss`, sin dejar imports rotos ni referencias al `.css` eliminado.

---

## Notes

- Este documento no cubre: catálogo de juegos navegable, carrito de compra, lista de favoritos, notificaciones ni búsqueda/selector de idioma funcionales — se especifican explícitamente como elementos visuales no funcionales en los Requisitos 3.4, 3.5 y 5.4, y podrán abordarse en spec-driven futuros.
- La decisión de qué método concreto usar para evitar la caja de fondo visible de `logo1.png` (Requisito 3.1) se documentará como decisión técnica en `design.md`.
- `Tienda.jsx` se retira como página independiente (Requisito 5.5); si su lógica de bienvenida resulta útil más adelante para una zona de usuario autenticado más completa, podrá recuperarse en un spec-driven futuro.
- Requisito 3.7 (Navbar fijo) se confirmó explícitamente con el usuario: el Navbar permanece anclado arriba en todo momento durante el scroll (no se oculta al bajar ni deja de estar fijo), combinado con el fondo semitransparente del Requisito 3.8.
- Ajuste solicitado por el usuario tras la Phase 2 (afecta a Requisitos 1.1, 1.4, 3.1): el Selector_Tema y el logotipo del Requisito 3.1 pasan a ser el mismo elemento — el logotipo es el propio control de cambio de tema (con efecto de zoom 3D al pasar el cursor por encima), en vez de un interruptor visual independiente junto al logo. El logotipo deja de navegar a `/`; el enlace "Inicio" (Requisito 3.3) sigue cubriendo esa navegación. Ver decisión técnica en `design.md`.
- Ronda de ajustes visuales del usuario tras probar la Home real (afecta a Requisitos 3.1, 3.6, 3.10, 4.5, 5.2, 6.6): reparto del Navbar en 3 zonas (logo/enlaces centrados/sesión), logotipo mucho más grande con recorte ajustado por tema para que ambos ocupen la misma caja visual (`logo1.png` con más lienzo vacío se recorta con `cover`, `logo2.png` ya ajustado usa `contain`), nuevo tramo de ancho intermedio donde solo las categorías se sustituyen por un icono de tres líneas, iconos de búsqueda/idioma/usuario añadidos, y "TENDENCIAS" reubicado como título del Grid_Juegos en vez de formar parte del Hero_Section. Detalle técnico completo en `design.md` y en las notas de `tasks.md` sobre las Tasks 7 y 10.
- Ajuste solicitado por el usuario tras completar la Phase 4 (nuevo Requisito 7bis): Register_Form abandona el diseño común con Login_Form (Navbar + tarjeta centrada) y pasa a un layout propio de dos mitades (formulario sin tarjeta a la izquierda + Imagen_Registro a la derecha), con solo el ThemeToggle como cabecera y placeholders en vez de labels visibles. Login_Form y ErrorPage no se ven afectados por este cambio. El usuario mencionó el asset como `downwalker-registro.png`; el fichero real en `GalinGames_react/public/` es `downwalker-registro.jpg` — se usa este nombre real en `design.md`/`tasks.md`.
- Segundo ajuste solicitado por el usuario (nuevo Requisito 7ter, Requisito 4 modificado): Login_Form recibe el mismo layout dividido que Register_Form (calcado, incluida la reutilización de `downwalker-registro.jpg`, el botón "X" y el enlace "‹ Volver al inicio"), con dos enlaces nuevos ("¿Has olvidado tu contraseña?" inerte, y "¿Aún no tienes cuenta?" hacia `/registro`). En paralelo, la zona de sesión del Navbar sin sesión iniciada sustituye "Iniciar sesión"/"Registrarse" por un Icono_Carrito decorativo y un Icono_Usuario que navega a `/login` — confirmado con el usuario que el estado autenticado (username + Cerrar sesión) no cambia. No existe todavía ningún flujo de recuperación de contraseña en el backend (`GalinGames_nodejs/`) ni en `.specs/login-autenticacion/`; el enlace correspondiente queda expresamente como "próximamente", igual que otros elementos no funcionales ya existentes en esta feature.
- Tercer ajuste (nuevo criterio 7bis.15/7ter.14-15): el usuario compartió capturas de referencia de una tienda externa (Instant Gaming) pidiendo copiar únicamente su **colocación estructural** (logo pequeño arriba a la izquierda sin solaparse, fila de accesos sociales con separador "o" antes de los campos, botón alargado, enlaces bajo el botón), conservando la paleta de temas y los checkboxes propios de GalinGames — no se copian sus colores, tipografía ni estilo de checkbox. Se añade la fila de Acceso_Social (Requisito 7bis.15/7ter.14, componente `BotonesSocial` reutilizado por ambos formularios) y, solo en Login_Form (la referencia de esa pantalla concreta lo mostraba así), los dos enlaces existentes pasan de apilados a la misma fila (Requisito 7ter.15). No existe backend de login social (Google/Facebook/Apple/Discord); los 4 botones son decorativos, mismo patrón que el Icono_Carrito.
