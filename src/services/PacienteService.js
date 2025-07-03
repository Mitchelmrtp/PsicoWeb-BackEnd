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
            const paciente = await this.pacienteRepository.findByIdSafe(id);
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
        // Admin can view all
        if (currentUser.role === 'admin') return true;
        
        // Patient can view their own record
        if (currentUser.userId === paciente.id) return true;
        
        // Psychologist can view their assigned patients
        if (currentUser.role === 'psicologo' && paciente.idPsicologo === currentUser.userId) {
            return true;
        }
        
        return false;
    }
    
    isAuthorizedToModifyPaciente(currentUser, paciente) {
        // Admin can modify all
        if (currentUser.role === 'admin') return true;
        
        // Patient can modify their own record (limited fields)
        if (currentUser.userId === paciente.id) return true;
        
        // Psychologist can modify their assigned patients
        if (currentUser.role === 'psicologo' && paciente.idPsicologo === currentUser.userId) {
            return true;
        }
        
        return false;
    }
}
