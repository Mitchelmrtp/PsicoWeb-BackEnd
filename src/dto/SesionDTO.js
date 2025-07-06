/**
 * Sesion Data Transfer Objects
 * Aplica el principio de Single Responsibility (SOLID)
 */

export class CreateSesionDTO {
  constructor(data) {
    this.idPsicologo = data.idPsicologo;
    this.idPaciente = data.idPaciente;
    this.fecha = data.fecha;
    this.horaInicio = data.horaInicio;
    this.horaFin = data.horaFin;
    this.notas = data.notas;
    this.estado = data.estado || 'programada';
  }

  validate() {
    const errors = [];
    
    if (!this.idPsicologo) errors.push('Psychologist ID is required');
    if (!this.idPaciente) errors.push('Patient ID is required');
    if (!this.fecha) errors.push('Date is required');
    if (!this.horaInicio) errors.push('Start time is required');
    
    return errors;
  }
}

export class UpdateSesionDTO {
  constructor(data) {
    this.fecha = data.fecha;
    this.horaInicio = data.horaInicio;
    this.horaFin = data.horaFin;
    this.notas = data.notas;
    this.estado = data.estado;
    this.cantidadReprogramaciones = data.cantidadReprogramaciones;
    this.costoAdicional = data.costoAdicional;
  }
}

export class SesionResponseDTO {
  constructor(sesion) {
    this.id = sesion.id;
    this.idPsicologo = sesion.idPsicologo;
    this.idPaciente = sesion.idPaciente;
    this.fecha = sesion.fecha;
    this.horaInicio = sesion.horaInicio;
    this.horaFin = sesion.horaFin;
    this.notas = sesion.notas;
    this.estado = sesion.estado;
    this.cantidadReprogramaciones = sesion.cantidadReprogramaciones || 0;
    this.costoAdicional = sesion.costoAdicional || 0;
    this.created_at = sesion.created_at;
    this.modified_at = sesion.modified_at;
    
    // Include related data if available
    if (sesion.Psicologo) {
      this.Psicologo = sesion.Psicologo;
    }
    if (sesion.Paciente) {
      this.Paciente = sesion.Paciente;
    }
    if (sesion.Pago) {
      this.Pago = sesion.Pago;
    }
  }
}
