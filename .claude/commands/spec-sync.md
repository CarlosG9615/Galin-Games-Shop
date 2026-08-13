---
description: Tras un cambio en design.md, actualiza tasks.md preservando las tareas ya completadas
argument-hint: <nombre-feature>
---

Vas a sincronizar `.specs/<feature>/tasks.md` con un cambio reciente en `.specs/<feature>/design.md`, siguiendo la metodología spec-driven descrita en `CLAUDE.md`.

Nombre de la feature indicado por el usuario:

$ARGUMENTS

## Pasos

1. Localiza `.specs/<feature>/design.md` y `.specs/<feature>/tasks.md`. Si falta alguno, detente y avísalo. No continúes sin ambos.
2. Lee el `tasks.md` actual completo y **anota qué tareas/subtareas están marcadas `[x]`** — esta es la información que NUNCA debes perder ni marcar como pendiente de nuevo.
3. Lee el `design.md` actual completo.
4. Determina qué cambió en el diseño respecto a lo que las tareas existentes asumen. Si el usuario no ha explicado el cambio, pregúntale qué se modificó en el diseño antes de tocar `tasks.md` (o compáralo tú mismo si tienes forma de ver el historial/diff de `design.md`, p. ej. `git diff` sobre ese archivo).
5. Actualiza `tasks.md` aplicando el principio de mínimo cambio:
   - Las tareas ya `[x]` se dejan intactas, tanto en contenido como en estado — no se reformulan ni se desmarcan, salvo que el cambio de diseño las invalide por completo (en cuyo caso, avisa explícitamente al usuario y pregunta cómo proceder antes de tocarlas).
   - Las tareas `[ ]` (pendientes) afectadas por el cambio de diseño se ajustan, se añaden o se eliminan según corresponda.
   - Las tareas `[ ]` no afectadas se dejan tal cual.
   - Si el cambio de diseño requiere tareas nuevas, añádelas en la posición lógica del documento (respetando fases/dependencias), no solo al final.
6. Revisa que las `**Dependencias:**` de las tareas afectadas sigan siendo correctas tras el cambio.
7. Muestra al usuario un resumen claro de: qué tareas se añadieron, cuáles se modificaron, cuáles se eliminaron, y confirma que ninguna tarea completada (`[x]`) perdió su estado sin que fuera una decisión explícita del usuario.
