/**
 * Objetivo DTOs
 * Aplica Data Transfer Object Pattern y Single Responsibility Principle
 * Maneja la transformación de datos entre capas
 */

export class CreateObjetivoDTO {
    constructor(data) {
        this.titulo = data.titulo;
        this.descripcion = data.descripcion || '';
        this.fechaInicio = data.fechaInicio || new Date().toISOString().split('T')[0];
        this.fechaLimite = data.fechaLimite || null;
        this.estado = data.estado || 'activo';
        this.prioridad = data.prioridad || 'media';
        this.progreso = data.progreso || 0;
        this.idPaciente = data.idPaciente;
        this.idPsicologo = data.idPsicologo;
        this.notas = data.notas || '';
    }
}

export class UpdateObjetivoDTO {
    constructor(data) {
        this.titulo = data.titulo;
        this.descripcion = data.descripcion;
        this.fechaLimite = data.fechaLimite;
        this.estado = data.estado;
        this.prioridad = data.prioridad;
        this.progreso = data.progreso;
        this.notas = data.notas;
    }
}

export class ObjetivoResponseDTO {
    constructor(objetivo) {
        this.id = objetivo.id;
        this.titulo = objetivo.titulo;
        this.descripcion = objetivo.descripcion;
        this.fechaInicio = objetivo.fechaInicio;
        this.fechaLimite = objetivo.fechaLimite;
        this.estado = objetivo.estado;
        this.prioridad = objetivo.prioridad;
        this.progreso = objetivo.progreso;
        this.notas = objetivo.notas;
        this.createdAt = objetivo.created_at;
        this.updatedAt = objetivo.updated_at;

        // Relaciones
        if (objetivo.paciente) {
            this.paciente = {
                id: objetivo.paciente.id,
                User: objetivo.paciente.User ? {
                    name: objetivo.paciente.User.name,
                    first_name: objetivo.paciente.User.first_name,
                    last_name: objetivo.paciente.User.last_name,
                    email: objetivo.paciente.User.email
                } : null
            };
        }

        if (objetivo.psicologo) {
            this.psicologo = {
                id: objetivo.psicologo.id,
                User: objetivo.psicologo.User ? {
                    name: objetivo.psicologo.User.name,
                    first_name: objetivo.psicologo.User.first_name,
                    last_name: objetivo.psicologo.User.last_name,
                    email: objetivo.psicologo.User.email
                } : null
            };
        }

        if (objetivo.ejercicios) {
            this.ejercicios = objetivo.ejercicios.map(ejercicio => ({
                id: ejercicio.id,
                titulo: ejercicio.titulo,
                descripcion: ejercicio.descripcion,
                estado: ejercicio.estado,
                fechaLimite: ejercicio.fechaLimite,
                fechaCompletado: ejercicio.fechaCompletado,
                dificultad: ejercicio.dificultad,
                duracionEstimada: ejercicio.duracionEstimada
            }));
        }

        // Calcular estadísticas
        if (objetivo.ejercicios && objetivo.ejercicios.length > 0) {
            const ejerciciosCompletados = objetivo.ejercicios.filter(e => e.estado === 'completado').length;
            this.estadisticas = {
                totalEjercicios: objetivo.ejercicios.length,
                ejerciciosCompletados,
                progresoCalculado: Math.round((ejerciciosCompletados / objetivo.ejercicios.length) * 100)
            };
        }
    }

    static fromArray(objetivos) {
        return objetivos.map(objetivo => new ObjetivoResponseDTO(objetivo));
    }

    static fromModel(objetivo) {
        return new ObjetivoResponseDTO(objetivo);
    }
}
