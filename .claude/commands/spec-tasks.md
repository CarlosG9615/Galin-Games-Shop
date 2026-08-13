---
description: Genera tasks.md (tareas atómicas con dependencias) a partir de requirements.md + design.md
argument-hint: <nombre-feature>
---

Vas a generar el documento `tasks.md` de una feature siguiendo la metodología spec-driven descrita en `CLAUDE.md`.

Nombre de la feature indicado por el usuario:

$ARGUMENTS

## Pasos

1. Localiza `.specs/<feature>/requirements.md` y `.specs/<feature>/design.md`. Si falta cualquiera de los dos:
   - Detente y avisa al usuario qué documento falta y sugiere el comando correspondiente (`/spec-requirements` o `/spec-design`). No continúes.
2. Si `.specs/<feature>/tasks.md` ya existe, léelo primero y **preserva el estado de las tareas ya marcadas `[x]`** — este comando es para generar el plan inicial completo; si el objetivo es ajustar tareas tras un cambio de diseño, usa `/spec-sync` en su lugar y adviértelo al usuario.
3. Lee `requirements.md` y `design.md` completos.
4. Redacta `.specs/<feature>/tasks.md` con esta estructura:
   - `# Implementation Plan: <título de la feature>`
   - `## Overview` — resumen de qué cubre el plan.
   - `## Tasks` — lista de tareas agrupadas por fase/área si tiene sentido (ej. Backend, Frontend, Testing). Cada tarea:
     - Es **atómica**: un cambio verificable de forma independiente (un archivo o módulo concreto).
     - Usa checkbox `- [ ]` (nunca marques `[x]` en un plan recién generado).
     - Indica `**Dependencias:**` explícitas (qué otras tareas deben completarse antes).
     - Indica `**Requisitos:**` referenciando los números de `requirements.md` que cubre.
     - Se descompone en subtareas `- [ ] N.M` cuando el trabajo tiene varios pasos concretos.
   - Opcional pero recomendado: un `## Task Dependency Graph` (mermaid) y una sección de `waves`/orden de ejecución si hay muchas tareas con dependencias cruzadas.
5. Verifica que cada requisito de `requirements.md` y cada elemento de `design.md` esté cubierto por al menos una tarea; señala huecos si los encuentras en vez de omitirlos.
6. Muestra el documento generado al usuario para su revisión antes de que se ejecute ninguna tarea con `/spec-execute`.
