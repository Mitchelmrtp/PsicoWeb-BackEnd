import { PacienteRepository } from '../repositories/PacienteRepository.js';
import { PsicologoRepository } from '../repositories/PsicologoRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { PacienteDTO } from '../dto/PacienteDTO.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';
import { validateUUID } from '../utils/validationUtils.js';

export class PacienteService {
    constructor() {
        this.pacienteRepository = new PacienteRepository();
        this.psicologoRepository = new PsicologoRepository();
        this.userRepository = new UserRepository();
    }
    
    async getAllPacientes() {
        try {
            const pacientes = await this.pacienteRepository.findAll();
            return createSuccessResponse(PacienteDTO.fromArray(pacientes));
        } catch (error) {
            throw createErrorResponse('Error retrieving patients', 500, error.message);
        }
    }
    
    async getPacienteById(id, currentUser) {
        try {
            console.log(`PacienteService.getPacienteById called with id: ${id}, currentUser:`, currentUser);
            
            if (!validateUUID(id)) {
                throw createErrorResponse('Invalid patient ID format', 400);
            }
            
            console.log(`Searching for patient with id: ${id}`);
            
            // Set timeout for database queries
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Database query timed out')), 5000);
            });
            
            // Limit the included attributes to reduce resource usage
            const patientPromise = this.pacienteRepository.findByIdSafe(id, {
                attributes: [
                    'id', 'motivoConsulta', 'diagnosticoPreliminar', 
                    'diagnostico', 'idPsicologo', 'fechaRegistro'
                ]
            });
            
            // Race the promises to prevent hanging
            const paciente = await Promise.race([patientPromise, timeoutPromise]);
            
            console.log(`Patient found:`, paciente ? 'Yes' : 'No');
            
            if (!paciente) {
                console.log(`Patient with id ${id} not found in database`);
                throw createErrorResponse('Patient not found', 404);
            }
            
            // Authorization check
            console.log(`Checking authorization for user ${currentUser.userId} with role ${currentUser.role}`);
            if (!this.isAuthorizedToViewPaciente(currentUser, paciente)) {
                console.log(`Access denied for user ${currentUser.userId} to view patient ${id}`);
                throw createErrorResponse('Access denied', 403);
            }
            
            console.log(`Authorization successful, returning patient data`);
            return createSuccessResponse(new PacienteDTO(paciente));
        } catch (error) {
            console.error(`Error in getPacienteById:`, error);
            if (error.message === 'Database query timed out') {
                throw createErrorResponse('Database query timed out due to resource constraints', 503, error.message);
            }
            if (error.statusCode) throw error;
            throw createErrorResponse('Error retrieving patient', 500, error.message);
        }
    }
    
    async createPaciente(pacienteData) {
        try {
            const paciente = await this.pacienteRepository.create(pacienteData);
            const pacienteWithUser = await this.pacienteRepository.findByIdSafe(paciente.id);
            
            return createSuccessResponse(new PacienteDTO(pacienteWithUser), 201);
        } catch (error) {
            throw createErrorResponse('Error creating patient', 500, error.message);
        }
    }
    
    async updatePaciente(id, updateData, currentUser) {
        try {
            if (!validateUUID(id)) {
                throw createErrorResponse('Invalid patient ID format', 400);
            }
            
            const paciente = await this.pacienteRepository.findOneByCondition({ id });
            
            if (!paciente) {
                throw createErrorResponse('Patient not found', 404);
            }
            
            // Authorization check
            if (!this.isAuthorizedToModifyPaciente(currentUser, paciente)) {
                throw createErrorResponse('Access denied', 403);
            }
            
            await this.pacienteRepository.update(id, updateData);
            const updatedPaciente = await this.pacienteRepository.findByIdSafe(id);
            
            return createSuccessResponse(new PacienteDTO(updatedPaciente));
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error updating patient', 500, error.message);
        }
    }
    
    async deletePaciente(id, currentUser) {
        try {
            if (!validateUUID(id)) {
                throw createErrorResponse('Invalid patient ID format', 400);
            }
            
            const paciente = await this.pacienteRepository.findOneByCondition({ id });
            
            if (!paciente) {
                throw createErrorResponse('Patient not found', 404);
            }
            
            // Authorization check (only admin can delete)
            if (currentUser.role !== 'admin') {
                throw createErrorResponse('Access denied - Admin required', 403);
            }
            
            await this.pacienteRepository.delete(id);
            
            return createSuccessResponse({ message: 'Patient deleted successfully' });
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error deleting patient', 500, error.message);
        }
    }
    
    async assignPsicologoToPaciente(pacienteId, psicologoId, currentUser) {
        try {
            if (!validateUUID(pacienteId) || !validateUUID(psicologoId)) {
                throw createErrorResponse('Invalid ID format', 400);
            }
            
            // Check if patient exists
            const paciente = await this.pacienteRepository.findOneByCondition({ id: pacienteId });
            if (!paciente) {
                throw createErrorResponse('Patient not found', 404);
            }
            
            // Check if psychologist exists
            const psicologo = await this.psicologoRepository.findOneByCondition({ id: psicologoId });
            if (!psicologo) {
                throw createErrorResponse('Psychologist not found', 404);
            }
            
            // Authorization check
            if (currentUser.role !== 'admin' && currentUser.userId !== psicologoId) {
                throw createErrorResponse('Access denied', 403);
            }
            
            // Assign psychologist to patient
            await this.pacienteRepository.update(pacienteId, { idPsicologo: psicologoId });
            
            const updatedPaciente = await this.pacienteRepository.findByIdSafe(pacienteId);
            
            return createSuccessResponse(new PacienteDTO(updatedPaciente));
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error assigning psychologist to patient', 500, error.message);
        }
    }
    
    async getPacientesByPsicologo(psicologoId, currentUser) {
        try {
            if (!validateUUID(psicologoId)) {
                throw createErrorResponse('Invalid psychologist ID format', 400);
            }
            
            // Authorization check
            if (currentUser.role !== 'admin' && currentUser.userId !== psicologoId) {
                throw createErrorResponse('Access denied', 403);
            }
            
            const pacientes = await this.pacienteRepository.findByPsicologoId(psicologoId);
            
            return createSuccessResponse(PacienteDTO.fromArray(pacientes));
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error retrieving patients by psychologist', 500, error.message);
        }
    }
    
    // Private helper methods
    isAuthorizedToViewPaciente(currentUser, paciente) {
        console.log('Verificando autorización:');
        console.log('- Usuario actual:', JSON.stringify({
            userId: currentUser.userId,
            role: currentUser.role
        }));
        console.log('- Paciente:', JSON.stringify({
            id: paciente.id,
            idPsicologo: paciente.idPsicologo
        }));
        
        // Admin can view all
        if (currentUser.role === 'admin') {
            console.log('- Autorizado: El usuario es admin');
            return true;
        }
        
        // Patient can view their own record (comparación de strings)
        const currentUserId = String(currentUser.userId || currentUser.id || '');
        const pacienteId = String(paciente.id || '');
        
        if (currentUserId === pacienteId) {
            console.log('- Autorizado: El paciente está viendo su propio perfil');
            return true;
        }
        
        // Psychologist can view their assigned patients
        if (currentUser.role === 'psicologo') {
            const psicologoId = String(currentUser.userId || currentUser.id || '');
            const pacientePsicologoId = String(paciente.idPsicologo || '');
            
            if (psicologoId && pacientePsicologoId && psicologoId === pacientePsicologoId) {
                console.log('- Autorizado: El psicólogo tiene asignado a este paciente');
                return true;
            }
        }
        
        console.log('- No autorizado: No cumple ninguna condición de acceso');
        return false;
    }
    
    isAuthorizedToModifyPaciente(currentUser, paciente) {
        console.log('Verificando autorización para modificar:');
        console.log('- Usuario actual:', JSON.stringify({
            userId: currentUser.userId,
            role: currentUser.role
        }));
        console.log('- Paciente:', JSON.stringify({
            id: paciente.id,
            idPsicologo: paciente.idPsicologo
        }));
        
        // Admin can modify all
        if (currentUser.role === 'admin') {
            console.log('- Autorizado: El usuario es admin');
            return true;
        }
        
        // Patient can modify their own record (limited fields)
        const currentUserId = String(currentUser.userId || currentUser.id || '');
        const pacienteId = String(paciente.id || '');
        
        if (currentUserId === pacienteId) {
            console.log('- Autorizado: El paciente está modificando su propio perfil');
            return true;
        }
        
        // Psychologist can modify their assigned patients
        if (currentUser.role === 'psicologo') {
            const psicologoId = String(currentUser.userId || currentUser.id || '');
            const pacientePsicologoId = String(paciente.idPsicologo || '');
            
            if (psicologoId && pacientePsicologoId && psicologoId === pacientePsicologoId) {
                console.log('- Autorizado: El psicólogo tiene asignado a este paciente');
                return true;
            }
        }
        
        console.log('- No autorizado: No cumple ninguna condición de acceso');
        return false;
    }
}
