export class PruebaDTO {
    constructor(data) {
        this.id = data.id;
        this.titulo = data.titulo;
        this.descripcion = data.descripcion;
        this.activa = data.activa;
        this.fechaCreacion = data.fechaCreacion;
        
        // Preguntas if included
        if (data.Preguntas) {
            // Keep both formats for backward compatibility
            this.Preguntas = data.Preguntas.map(pregunta => new PreguntaDTO(pregunta));
            this.preguntas = this.Preguntas; // Reference to the same array
        }
    }
    
    static fromArray(data) {
        return data.map(item => new PruebaDTO(item));
    }
}

export class PreguntaDTO {
    constructor(data) {
        this.id = data.id;
        this.enunciado = data.enunciado;
        this.opciones = data.opciones;
        this.pesoEvaluativo = data.pesoEvaluativo;
        this.idPrueba = data.idPrueba;
    }
    
    static fromArray(data) {
        return data.map(item => new PreguntaDTO(item));
    }
}

export class ResultadoPruebaDTO {
    constructor(data) {
        this.id = data.id;
        this.idPrueba = data.idPrueba;
        this.idPaciente = data.idPaciente;
        this.resultado = data.resultado;
        this.interpretacion = data.interpretacion;
        this.puntuacionTotal = data.puntuacionTotal;
        this.puntuacionPromedio = data.puntuacionPromedio;
        this.fechaRealizacion = data.fechaRealizacion;
        
        // Related data if included - mantener estructura original con mayúscula
        if (data.Prueba) {
            this.Prueba = new PruebaDTO(data.Prueba);
        }
        
        if (data.Paciente) {
            this.Paciente = {
                id: data.Paciente.id,
                User: data.Paciente.User ? {
                    name: data.Paciente.User.name,
                    first_name: data.Paciente.User.first_name,
                    last_name: data.Paciente.User.last_name
                } : undefined
            };
        }
        
        // Mantener también la versión en minúscula para retrocompatibilidad
        if (data.Prueba) {
            this.prueba = this.Prueba;
        }
    }
    
    static fromArray(data) {
        return data.map(item => new ResultadoPruebaDTO(item));
    }
}
