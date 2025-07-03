export class PacienteDTO {
    constructor(data) {
        this.id = data.id;
        this.motivoConsulta = data.motivoConsulta;
        this.diagnosticoPreliminar = data.diagnosticoPreliminar;
        this.diagnostico = data.diagnostico;
        this.idPsicologo = data.idPsicologo;
        this.fechaRegistro = data.fechaRegistro;
        this.activo = data.activo;
        
        // User data if included
        if (data.User) {
            this.user = {
                id: data.User.id,
                name: data.User.name,
                email: data.User.email,
                telephone: data.User.telephone,
                first_name: data.User.first_name,
                last_name: data.User.last_name
            };
        }
        
        // Psicologo data if included
        if (data.Psicologo) {
            this.psicologo = {
                id: data.Psicologo.id,
                especialidad: data.Psicologo.especialidad,
                biografia: data.Psicologo.biografia,
                user: data.Psicologo.User ? {
                    name: data.Psicologo.User.name,
                    email: data.Psicologo.User.email,
                    first_name: data.Psicologo.User.first_name,
                    last_name: data.Psicologo.User.last_name
                } : undefined
            };
        }
    }
    
    static fromArray(data) {
        return data.map(item => new PacienteDTO(item));
    }
}
