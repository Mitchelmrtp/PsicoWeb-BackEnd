/**
 * Psicologo Data Transfer Objects
 * Aplica el principio de Single Responsibility (SOLID)
 */

export class CreatePsicologoDTO {
  constructor(data) {
    this.id = data.id;
    this.especialidad = data.especialidad;
    this.licencia = data.licencia;
    this.formacion = data.formacion;
    this.biografia = data.biografia;
    this.anosExperiencia = data.anosExperiencia;
    this.tarifaPorSesion = data.tarifaPorSesion;
  }

  validate() {
    const errors = [];
    
    if (!this.especialidad) errors.push('Especialidad is required');
    if (!this.licencia) errors.push('Licencia is required');
    if (!this.formacion) errors.push('Formacion is required');
    
    return errors;
  }
}

export class UpdatePsicologoDTO {
  constructor(data) {
    this.especialidad = data.especialidad;
    this.licencia = data.licencia;
    this.formacion = data.formacion;
    this.biografia = data.biografia;
    this.anosExperiencia = data.anosExperiencia;
    this.tarifaPorSesion = data.tarifaPorSesion;
  }
}

export class PsicologoResponseDTO {
  constructor(psicologo) {
    this.id = psicologo.id;
    this.especialidad = psicologo.especialidad;
    this.licencia = psicologo.licencia;
    this.formacion = psicologo.formacion;
    this.biografia = psicologo.biografia;
    this.anosExperiencia = psicologo.anosExperiencia;
    this.tarifaPorSesion = psicologo.tarifaPorSesion;
    this.created_at = psicologo.created_at;
    this.modified_at = psicologo.modified_at;
    
    // Include User data if available
    if (psicologo.User) {
      this.User = {
        name: psicologo.User.name,
        email: psicologo.User.email,
        first_name: psicologo.User.first_name,
        last_name: psicologo.User.last_name,
        telephone: psicologo.User.telephone
      };
    }
  }
}
