# Diagrama de Clases UML - PsicoWeb

Este diagrama muestra la estructura de clases principal del sistema PsicoWeb, incluyendo las entidades del dominio, servicios y sus relaciones.

```mermaid
classDiagram
    direction TB
    class User {
        -UUID id
        -String name
        -String email
        -String password
        +String first_name
        +String last_name
        +String telephone
        +String role
        +validatePassword() boolean
        +hashPassword() String
        +getName() String
        +getEmail() String
    }
    class Psicologo {
        -UUID id
        +String especialidad
        +String licencia
        +String formacion
        +String biografia
        +Integer anosExperiencia
        +Decimal tarifaPorSesion
        +getDisponibilidad() Array
        +asignarPaciente() void
        +getTarifas() Decimal
    }
    class Paciente {
        -UUID id
        +UUID idPsicologo
        +String condicionMedica
        +String motivoConsulta
        +String preferenciaContacto
        +registrarEmocion() void
        +getPagosRealizados() Array
        +getObjetivos() Array
    }
    class Sesion {
        -UUID id
        +UUID idPsicologo
        +UUID idPaciente
        +Date fecha
        +Time horaInicio
        +Time horaFin
        +String notas
        +String estado
        +Decimal costo
        +programarSesion() void
        +completarSesion() void
        +cancelarSesion() void
        +getPagos() Array
    }
    class Chat {
        -UUID id
        +UUID idPsicologo
        +UUID idPaciente
        +String titulo
        +String estado
        +Date ultimaActividad
        +crearChat() void
        +archivarChat() void
        +enviarMensaje() Mensaje
    }
    class Mensaje {
        -UUID id
        +UUID idChat
        +UUID idEmisor
        +String contenido
        +String tipo
        +Boolean leido
        +Date fechaEnvio
        +enviarMensaje() void
        +marcarLeido() void
        +getEmisor() User
    }
    class Pago {
        -UUID id
        +UUID idSesion
        +Decimal monto
        +Decimal montoTotal
        +String metodoPago
        +String estado
        +Date fechaPago
        +procesarPago() void
        +confirmarPago() void
        +reembolsar() void
        +getPaciente() Paciente
    }
    class SesionService {
        -SesionRepository sesionRepository
        -PsicologoRepository psicologoRepository
        -PacienteRepository pacienteRepository
        -ChatService chatService
        +getAllSesiones() Array
        +createSesion() Sesion
        +crearSesionConChat() Object
        +updateSesion() Sesion
        +cancelarSesion() void
    }
    class PagoService {
        -PagoRepository pagoRepository
        -SesionService sesionService
        -EmailService emailService
        +procesarPago() Pago
        +procesarPagoConSesion() Object
        +confirmarPago() void
        +obtenerPagosPaciente() Array
    }
    class ChatService {
        -ChatRepository chatRepository
        -MensajeRepository mensajeRepository
        +crearChat() Chat
        +obtenerChats() Array
        +enviarMensaje() Mensaje
        +obtenerMensajes() Array
    }
    class EmailService {
        +enviarCorreoConfirmacionCita() void
        +enviarCorreoPago() void
        +verificarConexion() boolean
        +enviarNotificacion() void
    }
    class Objetivo {
        -UUID id
        +UUID idPaciente
        +String titulo
        +String descripcion
        +String estado
        +Date fechaCreacion
        +crearObjetivo() void
        +actualizarProgreso() void
        +completarObjetivo() void
    }
    class Ejercicio {
        -UUID id
        +UUID idObjetivo
        +String titulo
        +String descripcion
        +String tipo
        +completarEjercicio() void
        +getProgreso() Integer
    }
    
    %% Relaciones de Herencia
    User <|-- Psicologo : extends
    User <|-- Paciente : extends
    
    %% Relaciones del Dominio (sin ciclos redundantes)
    Psicologo "1" --> "0..*" Paciente : treats
    Psicologo "1" --> "0..*" Sesion : conducts
    Paciente "1" --> "0..*" Sesion : attends
    Psicologo "1" --> "0..*" Chat : participates
    Paciente "1" --> "0..*" Chat : participates
    Chat "1" --> "0..*" Mensaje : contains
    Sesion "1" --> "0..*" Pago : generates
    Paciente "1" --> "0..*" Objetivo : has
    Objetivo "1" --> "0..*" Ejercicio : contains
    
    %% Dependencias de Servicios
    SesionService ..> Sesion : manages
    SesionService ..> EmailService : uses
    SesionService ..> ChatService : uses
    PagoService ..> Pago : manages
    PagoService ..> SesionService : uses
    PagoService ..> EmailService : uses
    ChatService ..> Chat : manages
    ChatService ..> Mensaje : manages

    %% Anotaciones
    class User {
        <<abstract>>
    }
    class SesionService {
        <<service>>
    }
    class PagoService {
        <<service>>
    }
    class ChatService {
        <<service>>
    }
    class EmailService {
        <<service>>
    }
```

## Descripción de las Clases Principales

### Entidades del Dominio

- **User**: Clase base abstracta que contiene información común de usuarios
- **Psicologo**: Extiende User, representa a los profesionales de salud mental
- **Paciente**: Extiende User, representa a los usuarios que buscan atención psicológica
- **Sesion**: Representa una cita/sesión entre psicólogo y paciente
- **Chat**: Canal de comunicación entre psicólogo y paciente
- **Mensaje**: Mensajes individuales dentro de un chat
- **Pago**: Transacciones de pago por sesiones
- **Objetivo**: Metas terapéuticas asignadas a pacientes
- **Ejercicio**: Actividades específicas dentro de un objetivo

### Servicios

- **SesionService**: Gestiona la lógica de negocio de las sesiones
- **PagoService**: Maneja el procesamiento de pagos y creación automática de sesiones
- **ChatService**: Administra la comunicación entre usuarios
- **EmailService**: Servicio para envío de correos electrónicos automáticos

## Relaciones Principales

1. **Herencia**: Psicologo y Paciente heredan de User
2. **Asociación**: Un psicólogo puede tener múltiples pacientes
3. **Composición**: Las sesiones, chats y pagos están vinculados a usuarios específicos
4. **Dependencia**: Los servicios dependen de las entidades para realizar operaciones

## Funcionalidades Clave

- **Gestión de Usuarios**: Registro y autenticación de psicólogos y pacientes
- **Reserva de Citas**: Creación automática de sesiones con chat y notificaciones por email
- **Sistema de Pago**: Procesamiento de pagos con creación automática de sesiones
- **Comunicación**: Chat en tiempo real entre psicólogo y paciente
- **Gestión Terapéutica**: Objetivos y ejercicios personalizados
- **Notificaciones**: Correos automáticos de confirmación de citas
