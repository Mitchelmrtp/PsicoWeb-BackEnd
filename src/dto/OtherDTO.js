export class DisponibilidadDTO {
    constructor(data) {
        this.id = data.id;
        this.idPsicologo = data.idPsicologo;
        this.diaSemana = data.diaSemana;
        this.horaInicio = data.horaInicio;
        this.horaFin = data.horaFin;
        this.activo = data.activo; // Usar el mismo nombre que en el modelo
        
        // Psicologo data if included
        if (data.Psicologo) {
            this.psicologo = {
                id: data.Psicologo.id,
                especialidad: data.Psicologo.especialidad,
                user: data.Psicologo.User ? {
                    name: data.Psicologo.User.name,
                    first_name: data.Psicologo.User.first_name,
                    last_name: data.Psicologo.User.last_name
                } : undefined
            };
        }
    }
    
    static fromArray(data) {
        return data.map(item => new DisponibilidadDTO(item));
    }
}

export class CalendarioDTO {
    constructor(data) {
        this.id = data.id;
        this.titulo = data.titulo;
        this.descripcion = data.descripcion;
        this.fechaInicio = data.fechaInicio;
        this.fechaFin = data.fechaFin;
        this.esRecurrente = data.esRecurrente;
        this.tipoRecurrencia = data.tipoRecurrencia;
        this.idUsuario = data.idUsuario;
        
        // User data if included
        if (data.User) {
            this.user = {
                id: data.User.id,
                name: data.User.name,
                email: data.User.email,
                first_name: data.User.first_name,
                last_name: data.User.last_name
            };
        }
    }
    
    static fromArray(data) {
        return data.map(item => new CalendarioDTO(item));
    }
}

export class NotificacionDTO {
    constructor(data) {
        this.id = data.id;
        this.mensaje = data.mensaje;
        this.tipo = data.tipo;
        this.leida = data.leida;
        this.fechaCreacion = data.fechaCreacion;
        this.idUsuario = data.idUsuario;
        
        // User data if included
        if (data.User) {
            this.user = {
                id: data.User.id,
                name: data.User.name,
                email: data.User.email,
                first_name: data.User.first_name,
                last_name: data.User.last_name
            };
        }
    }
    
    static fromArray(data) {
        return data.map(item => new NotificacionDTO(item));
    }
}
