# AGENTS.md

Guia de trabajo para agentes y colaboradores en este proyecto.

## Contexto Inicial

Antes de analizar o modificar el proyecto, escanear los nombres de los archivos para entender la estructura actual.

Comando recomendado:

```bash
rg --files
```

Si `rg` no esta disponible, usar `find . -type f`.

La lectura del arbol de archivos es parte del flujo de trabajo normal, porque este proyecto esta organizado por features y cada nombre de archivo comunica intencion.

## Feature Slide Design

La UI se organiza por pantallas tipo slide dentro de `src/features`.

Reglas:

- Cada feature visual debe vivir en su propia carpeta bajo `src/features/<feature>/`.
- El componente principal de una feature debe usar el patron `<FeatureName>Slide.tsx`.
- Las piezas auxiliares de una feature deben quedarse cerca de esa feature cuando no sean compartidas.
- Evitar crear pantallas genericas sin contexto de producto. Cada slide debe representar un paso claro del flujo del usuario.
- Mantener los slides enfocados: autenticacion, busqueda, esquema, script, dashboard, etc.

## Funciones Independientes

Todas las funciones deben vivir en archivos independientes: una funcion principal por archivo.

Reglas:

- El archivo debe tener un nombre explicito que describa la accion.
- El nombre de la funcion debe coincidir con la intencion del archivo.
- Evitar archivos tipo `utils.ts`, `helpers.ts` o `services.ts` cuando oculten varias responsabilidades.
- Si una funcion crece o mezcla responsabilidades, dividirla en archivos mas pequenos y explicitos.
- Las funciones de backend deben seguir el patron actual bajo `server/features/<domain>/<action>.ts`.
- Antes de crear una funcion nueva, buscar por nombre e intencion en el arbol de archivos. Si ya existe logica equivalente, reutilizarla o extraer un helper explicito en lugar de duplicar codigo.
- Si dos endpoints necesitan el mismo flujo de lectura, busqueda, validacion o transformacion, compartir esa parte en una funcion independiente con nombre de dominio.
- Despues de cambios que agreguen logica, correr `npm run duplicates` y revisar clones nuevos. No introducir duplicacion funcional en backend, auth, Firebase, Gmail, Firestore o llamadas API.

Ejemplos actuales:

- `server/features/auth/requireFirebaseUser.ts`
- `server/features/auth/verifyFirebaseIdToken.ts`
- `server/features/emails/searchEmails.ts`
- `server/features/extractors/createExtractor.ts`

## Documentacion Visual

El flujo principal debe mantenerse documentado con Mermaid en `sequence-diagram.md`.

Reglas:

- Actualizar `sequence-diagram.md` cuando cambie la interaccion entre usuario, frontend, backend, Gmail, Gemini, Firebase o webhooks.
- El diagrama debe mostrar quien inicia cada accion y que sistema responde.
- Si se agrega un endpoint, una pantalla o una integracion externa relevante, revisar si el diagrama necesita cambios.
- Mantener el diagrama como referencia de producto e implementacion, no como decoracion.

## Firebase Runtime

Durante cambios relacionados con Firebase:

- Reemplazar supuestos de runtime por configuracion explicita.
- Mantener separadas las decisiones de frontend, backend, autenticacion, persistencia y deploy.
- Preferir Firestore para datos persistentes si reemplaza la base local actual.
- Documentar cambios de flujo en `sequence-diagram.md` cuando Firebase entre en el recorrido.
