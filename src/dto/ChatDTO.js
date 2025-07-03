/**
 * Chat DTOs
 * Aplica Data Transfer Object Pattern y Single Responsibility Principle
 * Maneja la transformación de datos entre capas
 */

export class ChatDTO {
    constructor(data) {
        this.id = data.id;
        this.idPsicologo = data.idPsicologo;
        this.idPaciente = data.idPaciente;
        this.titulo = data.titulo;
        this.estado = data.estado;
        this.ultimaActividad = data.ultimaActividad;
        this.createdAt = data.created_at || data.createdAt;
        this.updatedAt = data.modified_at || data.updatedAt;
        
        // Relaciones
        if (data.psicologo) {
            this.psicologo = {
                id: data.psicologo.id,
                especialidad: data.psicologo.especialidad,
                user: data.psicologo.User ? {
                    name: data.psicologo.User.name,
                    first_name: data.psicologo.User.first_name,
                    last_name: data.psicologo.User.last_name,
                    email: data.psicologo.User.email
                } : null
            };
        }
        
        if (data.paciente) {
            this.paciente = {
                id: data.paciente.id,
                motivoConsulta: data.paciente.motivoConsulta,
                user: data.paciente.User ? {
                    name: data.paciente.User.name,
                    first_name: data.paciente.User.first_name,
                    last_name: data.paciente.User.last_name,
                    email: data.paciente.User.email
                } : null
            };
        }
        
        // Último mensaje si está disponible
        if (data.mensajes && data.mensajes.length > 0) {
            const ultimoMensaje = data.mensajes[data.mensajes.length - 1];
            this.ultimoMensaje = new MensajeDTO(ultimoMensaje);
        }
        
        // Contador de mensajes no leídos
        if (data.mensajesNoLeidos !== undefined) {
            this.mensajesNoLeidos = data.mensajesNoLeidos;
        }
    }
    
    static fromArray(dataArray) {
        return dataArray.map(data => new ChatDTO(data));
    }
}

export class MensajeDTO {
    constructor(data) {
        this.id = data.id;
        this.idChat = data.idChat;
        this.idEmisor = data.idEmisor;
        this.contenido = data.contenido;
        this.tipoMensaje = data.tipoMensaje;
        this.nombreArchivo = data.nombreArchivo;
        this.rutaArchivo = data.rutaArchivo;
        this.tamanoArchivo = data.tamanoArchivo;
        this.mimeType = data.mimeType;
        this.leido = data.leido;
        this.fechaLectura = data.fechaLectura;
        this.createdAt = data.created_at || data.createdAt;
        this.updatedAt = data.modified_at || data.updatedAt;
        
        // Información del emisor
        if (data.emisor) {
            this.emisor = {
                id: data.emisor.id,
                name: data.emisor.name,
                first_name: data.emisor.first_name,
                last_name: data.emisor.last_name,
                email: data.emisor.email,
                role: data.emisor.role
            };
        }
    }
    
    static fromArray(dataArray) {
        return dataArray.map(data => new MensajeDTO(data));
    }
}

export class CreateChatDTO {
    constructor(data) {
        this.idPsicologo = data.idPsicologo;
        this.idPaciente = data.idPaciente;
        this.titulo = data.titulo || 'Chat de Consulta';
    }
}

export class CreateMensajeDTO {
    constructor(data) {
        this.idChat = data.idChat;
        this.idEmisor = data.idEmisor;
        this.contenido = data.contenido;
        this.tipoMensaje = data.tipoMensaje || 'texto';
        this.nombreArchivo = data.nombreArchivo || null;
        this.rutaArchivo = data.rutaArchivo || null;
        this.tamanoArchivo = data.tamanoArchivo || null;
        this.mimeType = data.mimeType || null;
    }
}

export class UpdateMensajeDTO {
    constructor(data) {
        if (data.leido !== undefined) this.leido = data.leido;
        if (data.fechaLectura !== undefined) this.fechaLectura = data.fechaLectura;
    }
}
