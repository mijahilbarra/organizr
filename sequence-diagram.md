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

  User->>Frontend: Abre la app
  Frontend->>Frontend: Lee configuracion VITE_FIREBASE_*
  User->>Frontend: Presiona Sign in with Google
  Frontend->>FirebaseAuth: signInWithPopup(GoogleProvider + gmail.readonly)
  FirebaseAuth->>GoogleProvider: Solicita identidad y scope Gmail readonly
  User->>GoogleProvider: Autoriza cuenta y permisos
  GoogleProvider-->>FirebaseAuth: Devuelve credencial Google
  FirebaseAuth-->>Frontend: Devuelve usuario Firebase
  Frontend->>Frontend: Obtiene Firebase ID token
  Frontend->>Frontend: Conserva access token Gmail temporal si Google lo entrega
  Frontend-->>User: Muestra estado autenticado
```

## Historia 2: Buscar Correos Candidatos

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Frontend as Frontend React
  participant Function as Firebase Function api
  participant FirebaseAuth as Firebase Admin Auth
  participant Gmail as Gmail API

  User->>Frontend: Escribe asunto o texto de busqueda
  Frontend->>Function: searchEmails(query) con Authorization Firebase y X-Gmail-Token
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Gmail: Busca mensajes candidatos con access token Gmail
  Gmail-->>Function: Lista de mensajes y metadata
  Function-->>Frontend: Devuelve correos candidatos
  Frontend-->>User: Muestra resultados para seleccionar
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
  Function-->>Frontend: Devuelve propuesta
  Frontend-->>User: Muestra esquema y datos para revision
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
  Frontend->>Function: createExtractor(schema, initialEmails) con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Gemini: Genera script extractor JS
  Gemini-->>Function: Script extractor
  Function->>Function: testExtractor(script, exampleEmails)

  alt Extractor valido
    Function->>Firestore: Guarda extractor y primera extraccion
    Function-->>Frontend: Devuelve extractor guardado
    Frontend-->>User: Muestra dashboard con tabla
  else Extractor invalido
    Function-->>Frontend: Devuelve error o solicita ajuste
    Frontend-->>User: Muestra estado para correccion
  end
```

## Historia 6: Ejecutar Extractor Existente

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Frontend as Frontend React
  participant Function as Firebase Function api
  participant FirebaseAuth as Firebase Admin Auth
  participant Firestore as Firestore
  participant Gmail as Gmail API

  User->>Frontend: Ejecuta extractor o agrega correos
  Frontend->>Function: triggerExtractor(extractorId) con Authorization Firebase y X-Gmail-Token
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Lee extractor y ultima ejecucion
  Firestore-->>Function: Configuracion del extractor
  Function->>Gmail: Obtiene correos relacionados con access token Gmail
  Gmail-->>Function: Correos nuevos
  Function->>Function: Ejecuta script extractor
  Function->>Firestore: Guarda extracciones nuevas
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
  Function->>Firestore: Guarda configuracion webhook
  Function-->>Frontend: Confirma configuracion
  Frontend-->>User: Muestra webhook activo

  User->>Frontend: Solicita enviar extraccion
  Frontend->>Function: sendToWebhook(extractorId, extractionId) con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Lee extraccion y webhook
  Firestore-->>Function: Datos extraidos y URL
  Function->>Webhook: Envia datos extraidos
  Webhook-->>Function: Respuesta del endpoint
  Function-->>Frontend: Devuelve estado de envio
  Frontend-->>User: Muestra resultado del envio
```
