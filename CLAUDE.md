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
- Las tasks de `tasks.md` se ejecutan **de una en una**: se marca `[x]` al terminar cada una y se muestra el diff correspondiente antes de pasar a la siguiente.
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
- `/spec-tasks <feature>` — genera `.specs/<feature>/tasks.md` a partir de `requirements.md` + `design.md`
- `/spec-execute <feature>` — ejecuta la siguiente tarea pendiente de `tasks.md` y marca su checkbox
- `/spec-sync <feature>` — tras un cambio en `design.md`, actualiza `tasks.md` preservando las tareas ya completadas
