/**
 * Data Transfer Object para Registros de Emociones
 * Aplica el patrón DTO para transferencia de datos limpia
 */
export class RegistroEmocionDTO {
  constructor(data) {
    this.id = data.id;
    this.idPaciente = data.idPaciente;
    this.idPsicologo = data.idPsicologo;
    this.idSesion = data.idSesion;
    this.fechaRegistro = data.fechaRegistro;
    this.emociones = data.emociones;
    this.comentarios = data.comentarios;
    this.estadoGeneral = data.estadoGeneral;
    this.intensidadPromedio = data.intensidadPromedio;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;

    // Información adicional si está incluida
    if (data.paciente) {
      this.paciente = {
        id: data.paciente.id,
        name: data.paciente.User?.name || data.paciente.name,
        first_name: data.paciente.User?.first_name,
        last_name: data.paciente.User?.last_name
      };
    }

    if (data.psicologo) {
      this.psicologo = {
        id: data.psicologo.id,
        name: data.psicologo.User?.name || data.psicologo.name,
        first_name: data.psicologo.User?.first_name,
        last_name: data.psicologo.User?.last_name
      };
    }

    if (data.sesion) {
      this.sesion = {
        id: data.sesion.id,
        fechaHora: data.sesion.fechaHora,
        estado: data.sesion.estado
      };
    }
  }

  /**
   * Convierte el DTO a formato para respuesta de la API
   */
  toResponse() {
    return {
      id: this.id,
      fechaRegistro: this.fechaRegistro,
      emociones: this.emociones,
      comentarios: this.comentarios,
      estadoGeneral: this.estadoGeneral,
      intensidadPromedio: this.intensidadPromedio,
      paciente: this.paciente,
      psicologo: this.psicologo,
      sesion: this.sesion,
      createdAt: this.createdAt
    };
  }

  /**
   * Convierte el DTO a formato simplificado para listas
   */
  toSummary() {
    return {
      id: this.id,
      fechaRegistro: this.fechaRegistro,
      estadoGeneral: this.estadoGeneral,
      intensidadPromedio: this.intensidadPromedio,
      emocionPrincipal: this.getEmocionPrincipal(),
      paciente: this.paciente?.name,
      psicologo: this.psicologo?.name
    };
  }

  /**
   * Obtiene la emoción con mayor intensidad del registro
   */
  getEmocionPrincipal() {
    if (!this.emociones) return null;
    
    return Object.entries(this.emociones).reduce((max, [emocion, intensidad]) => 
      intensidad > (max.intensidad || 0) ? { emocion, intensidad } : max
    , {}).emocion;
  }

  /**
   * Crea un array de DTOs desde un array de datos
   */
  static fromArray(dataArray) {
    return dataArray.map(data => new RegistroEmocionDTO(data));
  }
}

/**
 * DTO para estadísticas de emociones
 */
export class EstadisticasEmocionDTO {
  constructor(data) {
    this.totalRegistros = data.totalRegistros;
    this.promedioIntensidad = data.promedioIntensidad;
    this.emocionMasFrecuente = data.emocionMasFrecuente;
    this.estadoGeneralPromedio = data.estadoGeneralPromedio;
    this.registrosPorMes = data.registrosPorMes;
    this.evolucionEmocional = data.evolucionEmocional;
  }

  toResponse() {
    return {
      resumen: {
        totalRegistros: this.totalRegistros,
        promedioIntensidad: this.promedioIntensidad,
        emocionMasFrecuente: this.emocionMasFrecuente,
        estadoGeneral: this.estadoGeneralPromedio
      },
      graficos: {
        registrosPorMes: this.registrosPorMes,
        evolucionEmocional: this.evolucionEmocional
      }
    };
  }
}
