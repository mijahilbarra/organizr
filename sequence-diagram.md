# Sequence Diagrams

Este documento describe el flujo vivo por historias de usuario. Debe actualizarse cuando cambien pantallas, endpoints, integraciones o persistencia.

## Historia 1: Autenticarse Con Firebase Auth Y Autorizar Gmail

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Frontend as Frontend React
  participant FirebaseAuth as Firebase Auth
  participant GoogleProvider as Google Provider
  participant Function as Firebase Function api
  participant Firestore as Firestore

  User->>Frontend: Abre la app
  Frontend->>Frontend: Lee configuracion VITE_FIREBASE_*
  User->>Frontend: Presiona Sign in with Google o abre menu Usuario, Preferencias, Conectar Gmail
  Frontend->>FirebaseAuth: signInWithPopup(GoogleProvider + gmail.readonly)
  FirebaseAuth->>GoogleProvider: Solicita identidad y scope Gmail readonly
  User->>GoogleProvider: Autoriza cuenta y permisos
  GoogleProvider-->>FirebaseAuth: Devuelve credencial Google
  FirebaseAuth-->>Frontend: Devuelve usuario Firebase
  Frontend->>Frontend: Obtiene Firebase ID token
  Frontend->>Function: getProfile() con Authorization Firebase
  Function->>Firestore: Crea o lee users/{uid}
  Firestore-->>Function: Perfil y estado Gmail
  Function-->>Frontend: Devuelve perfil sin access token
  alt Google entrega access token Gmail
    Frontend->>Function: connectGmail(accessToken) con Authorization Firebase
    Function->>Firestore: Guarda access token en users/{uid} con expiracion semanal
    Function-->>Frontend: Devuelve perfil con Gmail conectado
  end
  Frontend->>Function: listExtractors() con Authorization Firebase
  Function->>Firestore: Consulta extractors donde userId = uid
  Function-->>Frontend: Devuelve extractores
  Frontend-->>User: Muestra dashboard y opcion de crear extractor
  User->>Frontend: Abre el menu Avatar y entra a /profile
  Frontend-->>User: Muestra ProfileSlide fuera del flujo principal
```

## Historia 2: Crear Extractor Con Primer Asunto Y Buscar Correos Candidatos

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Frontend as Frontend React
  participant Function as Firebase Function api
  participant FirebaseAuth as Firebase Admin Auth
  participant Firestore as Firestore
  participant Gmail as Gmail API

  User->>Frontend: Crea extractor escribiendo el primer asunto del correo
  Frontend->>Frontend: Guarda el asunto inicial como subjects del extractor en creacion
  Frontend->>Function: searchEmails(subject) con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Lee token Gmail persistido en users/{uid}
  alt Token activo
    Function->>Gmail: Busca mensajes candidatos con access token Gmail
  else Token ausente, revocado o expirado
    Function-->>Frontend: Solicita reconectar Gmail
  end
  Gmail-->>Function: Lista de mensajes y metadata
  Function-->>Frontend: Devuelve correos candidatos
  Frontend-->>User: Muestra correos candidatos para seleccionar y extraer
```

## Historia 3: Analizar Un Correo Y Proponer Esquema

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Frontend as Frontend React
  participant Function as Firebase Function api
  participant FirebaseAuth as Firebase Admin Auth
  participant Gemini as Gemini API

  User->>Frontend: Selecciona correos ejemplo
  Frontend->>Function: analyzeEmails(emails) con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Gemini: Solicita esquema y datos extraidos
  Gemini-->>Function: Esquema propuesto y extraccion inicial
  loop Rebotes de perfeccionamiento
    Function->>Function: Prueba parser contra correos seleccionados
    Function->>Gemini: Envia fallos, campos vacios y feedback del parser
    Gemini-->>Function: Devuelve parser/esquema corregido
  end
  Function-->>Frontend: Devuelve propuesta y logs informativos
  Frontend-->>User: Muestra esquema, datos y log de refinamiento
```

## Historia 4: Ajustar Esquema Antes De Aprobar

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Frontend as Frontend React
  participant Function as Firebase Function api
  participant FirebaseAuth as Firebase Admin Auth
  participant Gemini as Gemini API

  User->>Frontend: Edita campos detectados
  Frontend->>Function: Envia esquema actualizado y contexto
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Gemini: Ajusta propuesta con instrucciones del usuario
  Gemini-->>Function: Nueva propuesta de esquema y datos
  Function-->>Frontend: Devuelve propuesta actualizada
  Frontend-->>User: Muestra revision actualizada
```

## Historia 5: Crear Y Guardar Extractor

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Frontend as Frontend React
  participant Function as Firebase Function api
  participant FirebaseAuth as Firebase Admin Auth
  participant Gemini as Gemini API
  participant Firestore as Firestore

  User->>Frontend: Aprueba esquema
  Frontend->>Function: createExtractor(schema, subjects, initialEmails) con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Gemini: Genera script extractor JS
  Gemini-->>Function: Script extractor
  Function->>Function: testExtractor(script, exampleEmails)

  alt Extractor valido
    Function->>Firestore: Guarda documento extractors/{extractorId} con userId y primera extraccion
    Function-->>Frontend: Devuelve extractor guardado
    Frontend-->>User: Muestra dashboard con tabla
  else Extractor invalido
    Function-->>Frontend: Devuelve error o solicita ajuste
    Frontend-->>User: Muestra estado para correccion
  end
```

## Historia 6: Ejecutar Extractor Existente Y Agregar Asuntos

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Frontend as Frontend React
  participant Function as Firebase Function api
  participant FirebaseAuth as Firebase Admin Auth
  participant Firestore as Firestore
  participant Gmail as Gmail API
  participant Gemini as Gemini API

  User->>Frontend: Agrega un nuevo asunto al extractor existente
  Frontend->>Function: addExtractorSubject(extractorId, subject) con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Lee extractors/{extractorId} y valida userId
  Function->>Firestore: Lee token Gmail persistido en users/{uid}
  Function->>Gmail: Busca correos candidatos por el nuevo subject
  Gmail-->>Function: Devuelve correos candidatos
  Function->>Gemini: Extrae datos usando solo el esquema actual del extractor
  Gemini-->>Function: Devuelve datos estructurados por email
  Function->>Firestore: Actualiza el documento del extractor con subject y nuevas extracciones
  Function-->>Frontend: Devuelve extractor actualizado y conteo extraido
  Frontend-->>User: Muestra subject registrado y filas nuevas en la tabla

  User->>Frontend: Ejecuta extractor o sincroniza correos
  Frontend->>Function: triggerExtractor(extractorId) con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Lee extractors/{extractorId}, valida userId y lee token Gmail
  Firestore-->>Function: Configuracion del extractor compartido
  alt Token Gmail activo
    loop Por cada asunto registrado
      Function->>Gmail: Busca correos por subject con access token Gmail
    end
  else Token ausente, revocado o expirado
    Function-->>Frontend: Solicita reconectar Gmail
  end
  Gmail-->>Function: Correos nuevos
  Function->>Function: Ejecuta script extractor
  Function->>Firestore: Actualiza extractors/{extractorId} con extracciones nuevas
  Function-->>Frontend: Devuelve resultados
  Frontend-->>User: Actualiza tabla
```

## Historia 7: Configurar Y Enviar A Webhook Externo

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Frontend as Frontend React
  participant Function as Firebase Function api
  participant FirebaseAuth as Firebase Admin Auth
  participant Firestore as Firestore
  participant Webhook as Webhook externo

  User->>Frontend: Configura webhook
  Frontend->>Function: updateWebhook(extractorId, url) con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Actualiza extractors/{extractorId} tras validar userId
  Function-->>Frontend: Confirma configuracion
  Frontend-->>User: Muestra webhook activo

  User->>Frontend: Solicita enviar extraccion
  Frontend->>Function: sendToWebhook(extractorId, extractionId) con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Lee extractors/{extractorId}, valida userId y obtiene extraccion/webhook
  Firestore-->>Function: Datos extraidos y URL
  Function->>Webhook: Envia datos extraidos
  Webhook-->>Function: Respuesta del endpoint
  Function-->>Frontend: Devuelve estado de envio
  Frontend-->>User: Muestra resultado del envio
```

## Historia 8: Gestionar Tickets En Kanban

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  actor Codex as Codex CLI
  participant Frontend as Frontend React
  participant FirebaseAuth as Firebase Auth
  participant Firestore as Firestore
  participant AdminScript as Scripts Firebase Admin

  User->>Frontend: Abre Tickets desde el footer
  Frontend->>FirebaseAuth: Usa cuenta actual autenticada
  Frontend->>Firestore: onSnapshot(tickets)
  Firestore-->>Frontend: Devuelve tickets y cambios en vivo
  Frontend-->>User: Muestra kanban Backlog, To do, Doing, On review y Done

  User->>Frontend: Crea, edita, borra o arrastra un ticket
  Frontend->>Firestore: Escribe tickets/{ticketId} con usuario, urgencia y state
  Firestore-->>Frontend: Notifica snapshot actualizado
  Frontend-->>User: Refresca columnas del kanban

  Codex->>AdminScript: npm run tickets:read -- --state todo
  AdminScript->>Firestore: Lee coleccion tickets con Firebase Admin
  Firestore-->>AdminScript: Devuelve tickets filtrados por estado
  AdminScript-->>Codex: Imprime tickets y estados
  Codex->>AdminScript: npm run tickets:create o tickets:update-state
  AdminScript->>Firestore: Crea ticket como codex o cambia state
  Firestore-->>Frontend: Notifica snapshot actualizado
```

## Historia 9: Ver Perfil, Actualizar Datos Y Revocar Gmail

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Frontend as Frontend React
  participant Function as Firebase Function api
  participant FirebaseAuth as Firebase Admin Auth
  participant Firestore as Firestore
  participant GoogleOAuth as Google OAuth

  User->>Frontend: Abre Profile
  Frontend->>Function: getProfile() con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Lee users/{uid}
  Function-->>Frontend: Devuelve perfil sin access token
  Frontend-->>User: Muestra datos y estado Gmail

  User->>Frontend: Actualiza nombre o foto
  Frontend->>Function: updateProfile(displayName, photoURL)
  Function->>Firestore: Guarda perfil actualizado en users/{uid}
  Function-->>Frontend: Devuelve perfil actualizado

  User->>Frontend: Revoca Gmail
  Frontend->>Function: revokeGmail()
  Function->>Firestore: Lee access token persistido en users/{uid}
  Function->>GoogleOAuth: Revoca access token
  Function->>Firestore: Elimina conexion Gmail en users/{uid}
  Function-->>Frontend: Devuelve perfil sin Gmail conectado
```
