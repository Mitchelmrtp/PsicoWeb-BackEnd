# API Endpoints de Chat para PsicoWeb

Este documento detalla los endpoints RESTful disponibles para la funcionalidad de chat en la plataforma PsicoWeb.

## Endpoints Base

Base URL: `/api/chat`

## Endpoints de Chat

### Obtener chats del usuario
- **URL**: `/`
- **Método**: `GET`
- **Descripción**: Obtiene todos los chats asociados al usuario autenticado
- **Autenticación**: Requerida
- **Permisos**: Usuario autenticado
- **Respuesta exitosa**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "idPsicologo": 5,
        "idPaciente": 10,
        "createdAt": "2025-07-01T14:30:00Z",
        "updatedAt": "2025-07-02T09:15:00Z",
        "estado": "activo",
        "ultimaActividad": "2025-07-02T09:15:00Z",
        "psicologo": { ... },
        "paciente": { ... },
        "ultimoMensaje": { ... }
      }
    ]
  }
  ```

### Crear nuevo chat
- **URL**: `/`
- **Método**: `POST`
- **Descripción**: Crea un nuevo chat entre un psicólogo y un paciente
- **Autenticación**: Requerida
- **Permisos**: Usuario autenticado
- **Datos requeridos**:
  ```json
  {
    "idDestinatario": 5
  }
  ```
- **Respuesta exitosa**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "idPsicologo": 5,
      "idPaciente": 10,
      "createdAt": "2025-07-03T10:00:00Z",
      "updatedAt": "2025-07-03T10:00:00Z",
      "estado": "activo"
    }
  }
  ```

### Obtener chat por ID
- **URL**: `/:id`
- **Método**: `GET`
- **Descripción**: Obtiene un chat específico por su ID
- **Autenticación**: Requerida
- **Permisos**: Usuario debe ser participante del chat
- **Respuesta exitosa**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "idPsicologo": 5,
      "idPaciente": 10,
      "createdAt": "2025-07-01T14:30:00Z",
      "updatedAt": "2025-07-03T10:00:00Z",
      "estado": "activo",
      "ultimaActividad": "2025-07-03T10:00:00Z",
      "psicologo": { ... },
      "paciente": { ... }
    }
  }
  ```

### Actualizar estado del chat
- **URL**: `/:id/estado`
- **Método**: `PATCH`
- **Descripción**: Actualiza el estado del chat (activo/archivado)
- **Autenticación**: Requerida
- **Permisos**: Usuario debe ser participante del chat
- **Datos requeridos**:
  ```json
  {
    "estado": "archivado"
  }
  ```
- **Respuesta exitosa**:
  ```json
  {
    "success": true,
    "message": "Estado actualizado correctamente"
  }
  ```

## Endpoints de Mensajes

### Obtener mensajes de un chat
- **URL**: `/:chatId/mensajes`
- **Método**: `GET`
- **Descripción**: Obtiene los mensajes de un chat específico
- **Autenticación**: Requerida
- **Permisos**: Usuario debe ser participante del chat
- **Parámetros de consulta**:
  - `limit`: Número máximo de mensajes (default: 50)
  - `offset`: Desplazamiento para paginación (default: 0)
  - `ordenDesc`: Orden descendente por fecha (default: true)
- **Respuesta exitosa**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 101,
        "idChat": 1,
        "idRemitente": 10,
        "contenido": "Hola, ¿cómo estás?",
        "rutaArchivo": null,
        "nombreArchivo": null,
        "tipoArchivo": null,
        "leido": true,
        "createdAt": "2025-07-03T10:05:00Z"
      }
    ]
  }
  ```

### Enviar mensaje de texto
- **URL**: `/:chatId/mensajes`
- **Método**: `POST`
- **Descripción**: Envía un mensaje de texto en un chat
- **Autenticación**: Requerida
- **Permisos**: Usuario debe ser participante del chat
- **Datos requeridos**:
  ```json
  {
    "contenido": "Hola, ¿cómo estás?"
  }
  ```
- **Respuesta exitosa**:
  ```json
  {
    "success": true,
    "data": {
      "id": 102,
      "idChat": 1,
      "idRemitente": 10,
      "contenido": "Hola, ¿cómo estás?",
      "rutaArchivo": null,
      "leido": false,
      "createdAt": "2025-07-03T10:10:00Z"
    }
  }
  ```

### Enviar mensaje con archivo
- **URL**: `/:chatId/mensajes/archivo`
- **Método**: `POST`
- **Descripción**: Envía un mensaje con archivo adjunto
- **Autenticación**: Requerida
- **Permisos**: Usuario debe ser participante del chat
- **Formato**: `multipart/form-data`
- **Datos requeridos**:
  - `archivo`: Archivo a enviar (máximo 5MB)
  - `contenido`: Texto adicional (opcional)
- **Respuesta exitosa**:
  ```json
  {
    "success": true,
    "data": {
      "id": 103,
      "idChat": 1,
      "idRemitente": 10,
      "contenido": "Te envío el archivo",
      "rutaArchivo": "/uploads/chats/1234567890.pdf",
      "nombreArchivo": "documento.pdf",
      "tipoArchivo": "application/pdf",
      "leido": false,
      "createdAt": "2025-07-03T10:15:00Z"
    }
  }
  ```

### Marcar mensajes como leídos
- **URL**: `/:chatId/mensajes/leidos`
- **Método**: `PATCH`
- **Descripción**: Marca como leídos todos los mensajes no leídos del chat
- **Autenticación**: Requerida
- **Permisos**: Usuario debe ser participante del chat
- **Respuesta exitosa**:
  ```json
  {
    "success": true,
    "message": "Mensajes marcados como leídos",
    "data": {
      "count": 3
    }
  }
  ```

## Códigos de Estado HTTP

- `200 OK`: La solicitud se ha realizado correctamente
- `201 Created`: El recurso se ha creado correctamente
- `400 Bad Request`: Error en la solicitud del cliente
- `401 Unauthorized`: El usuario no está autenticado
- `403 Forbidden`: El usuario no tiene permisos para acceder al recurso
- `404 Not Found`: El recurso solicitado no existe
- `500 Internal Server Error`: Error interno del servidor

## Tipos de Archivos Permitidos

- Imágenes: `.jpg`, `.jpeg`, `.png`, `.gif`
- Documentos: `.pdf`, `.doc`, `.docx`
- Otros: `.txt`

## Límites

- Tamaño máximo de archivo: 5MB
- Máximo de mensajes por solicitud: 50
