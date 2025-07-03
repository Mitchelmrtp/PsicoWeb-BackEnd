export class PruebaDTO {
    constructor(data) {
        this.id = data.id;
        this.titulo = data.titulo;
        this.descripcion = data.descripcion;
        this.activa = data.activa;
        this.fechaCreacion = data.fechaCreacion;
        
        // Preguntas if included
        if (data.Preguntas) {
            this.preguntas = data.Preguntas.map(pregunta => new PreguntaDTO(pregunta));
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
        
        // Related data if included
        if (data.Prueba) {
            this.prueba = new PruebaDTO(data.Prueba);
        }
        
        if (data.Paciente) {
            this.paciente = {
                id: data.Paciente.id,
                user: data.Paciente.User ? {
                    name: data.Paciente.User.name,
                    first_name: data.Paciente.User.first_name,
                    last_name: data.Paciente.User.last_name
                } : undefined
            };
        }
    }
    
    static fromArray(data) {
        return data.map(item => new ResultadoPruebaDTO(item));
    }
}
