# CLAUDE.md

Guía de trabajo para Claude Code en el proyecto **tiendaVideojuegos** (GalinGames).

## Estructura del proyecto

- `GalinGames_react/` — Frontend (React + Vite)
- `GalinGames_nodejs/` — Backend (Node.js / Express)
- `.specs/` — Especificaciones de features (metodología spec-driven, ver abajo)

## Metodología Spec-Driven

Toda feature nueva vive en `.specs/<nombre-feature>/`, con tres documentos generados y consumidos siempre en este orden:

1. **`requirements.md`** — Historias de usuario en notación EARS (Easy Approach to Requirements Syntax). Cada criterio de aceptación sigue el patrón `WHEN [condición] THEN el sistema DEBERÁ [comportamiento]` (o variantes `IF/THEN`, `WHILE`, `WHERE`, `THE <componente> SHALL`).
2. **`design.md`** — Arquitectura, interfaces, modelos de datos, decisiones técnicas y sus alternativas consideradas. Se apoya en `requirements.md` y referencia los requisitos que cada decisión cubre.
3. **`tasks.md`** — Lista de tareas atómicas y verificables, con dependencias explícitas entre tareas y checkboxes `[ ]` (pendiente) / `[x]` (completada).

Reglas del flujo:

- **No se genera código sin que existan antes `requirements.md` y `design.md` aprobados** por el usuario para esa feature.
- El agente se encarga de estructurar la feature: redacta `requirements.md`, propone `design.md` y desglosa `tasks.md`. Debe presentar cada documento para aprobación antes de avanzar a la siguiente fase.
- El propósito por defecto es que el usuario practique la implementación. Toda tarea que implique escribir o modificar código, tests, configuración ejecutable, integración o verificación manual se considera **`[PRÁCTICA]`** y la realiza el usuario.
- El agente puede ejecutar tareas de documentación/spec (por ejemplo, crear o actualizar requisitos, diseño y plan) y tareas marcadas explícitamente como **`[AGENTE]`**. Al generar o sincronizar `tasks.md`, cada tarea pendiente debe llevar una de esas etiquetas; no se deben asignar al agente tareas de implementación solo por ser mecánicas o pequeñas.
- Si una tarea no tiene etiqueta (incluidas las tareas de specs ya existentes), se considera **`[PRÁCTICA]`**. No reclasificar ni ejecutar esas tareas sin que el usuario lo pida expresamente.
- Las tareas se realizan de una en una y respetando sus dependencias. `/spec-execute` solo puede implementar una tarea `[AGENTE]` que esté lista; si la siguiente tarea lista es `[PRÁCTICA]`, debe detenerse, indicar al usuario qué debe implementar y ofrecer ayuda mediante explicación, pistas o revisión, sin escribir el código ni marcar la tarea como completada.
- El usuario puede delegar una tarea `[PRÁCTICA]` concreta de forma explícita. Esa delegación solo aplica a la tarea indicada; no cambia el responsable del resto del plan.
- El usuario marca una tarea `[PRÁCTICA]` como completada cuando confirma que la terminó. El agente puede ayudar a revisar el resultado y explicar fallos, pero no debe sustituir la implementación por una solución completa salvo petición explícita.
- Si el diseño cambia a mitad de implementación: primero se actualiza `design.md`, y después se regeneran **solo** las tasks afectadas en `tasks.md`, sin tocar las tareas ya marcadas como completadas.

## Regla de seguridad — Spec-Driven Development

Si el usuario pide implementar, añadir o modificar una funcionalidad y esa
funcionalidad NO tiene una carpeta correspondiente en .specs/ con
requirements.md, design.md y tasks.md ya generados:

1. NO escribas código todavía.
2. Avisa al usuario: "Esta funcionalidad no tiene spec. ¿Genero primero
   requirements.md con /spec-requirements, o prefieres saltarte el proceso
   para este caso puntual?"
3. Espera confirmación antes de proceder.

## Comandos disponibles

- `/spec-requirements <descripción de la feature>` — genera `.specs/<feature>/requirements.md`
- `/spec-design <feature>` — genera `.specs/<feature>/design.md` a partir de `requirements.md`
- `/spec-tasks <feature>` — genera `.specs/<feature>/tasks.md` a partir de `requirements.md` + `design.md`, indicando `[PRÁCTICA]` o `[AGENTE]` en cada tarea pendiente
- `/spec-execute <feature>` — ejecuta solo la siguiente tarea lista `[AGENTE]`; si corresponde una tarea `[PRÁCTICA]`, la deja para el usuario y ofrece orientación sin implementarla
- `/spec-sync <feature>` — tras un cambio en `design.md`, actualiza `tasks.md` preservando las tareas ya completadas

## Identificadores MongoDB (ObjectId)

En `GalinGames_nodejs`, el `_id` de un documento es un `ObjectId` que **solo
existe si Mongo lo ha generado** al crear ese documento (o si proviene de un
documento ya creado, devuelto al cliente y reenviado tal cual, p. ej. el
`:id` de una `Address` en `PUT /api/addresses/:id`). Nunca se fabrica,
deriva o adivina un `ObjectId` a partir de otro dato (email, username, hash,
fecha, etc.) — ni con `new mongoose.Types.ObjectId(unDatoQueNoEsUnId)`, ni
concatenando/hasheando algo para que "parezca" un id válido.

- Cuando haya que **encontrar un documento concreto sin tener ya su `_id`
  real** (login, comprobar disponibilidad de username, verificar un email,
  identificar a un usuario por su email de recuperación, etc.), la consulta
  se hace por el **valor único de negocio** que esa colección ya declara
  como tal: `username`/`email` en `User`, el hash de un token en
  `PendingUser`/`PendingEmailChange`, etc. — nunca inventando o probando un
  `_id`.
- Cuando el `_id` real de un documento ya se conoce (ha sido creado por
  Mongo y devuelto al cliente en una respuesta anterior, o viene de
  `req.user.userId` tras verificar el JWT), sí es correcto usarlo
  directamente en la consulta (`findById`, `findOne({ _id, userId })` para
  comprobar propiedad, etc.).
- Antes de programar un controlador/servicio nuevo que necesite "buscar a
  X", identifica primero cuál es el campo único real de esa colección y
  úsalo en el `findOne`, en vez de construir o suponer un `_id`.

## Internacionalización (i18n)

El proyecto usa `react-i18next`. Todo texto visible para el usuario en
`GalinGames_react` DEBE resolverse mediante una clave de traducción
(`useTranslation()` + `t('namespace.clave')`), nunca como literal en el JSX.

- Las claves se escriben en inglés, cortas y descriptivas (ej. `hero.discoverSubtitle`),
  namespaced por componente/sección (`navbar.*`, `login.*`, `common.*`, ...).
  Nunca se usa el texto completo como clave.
- Toda clave nueva se añade en `src/i18n/locales/es.json` (idioma de referencia)
  **y** en `en.json`, con la misma estructura de claves.
- Texto con datos dinámicos usa interpolación `{{variable}}` de i18next, no
  concatenación de strings.
- Al generar `design.md`/`tasks.md` de una feature nueva, las tareas que
  introduzcan texto de interfaz deben incluir explícitamente la adición de
  las claves correspondientes a `es.json`/`en.json`.
