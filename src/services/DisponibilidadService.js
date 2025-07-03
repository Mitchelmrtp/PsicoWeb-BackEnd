import { DisponibilidadRepository } from '../repositories/DisponibilidadRepository.js';
import { PsicologoRepository } from '../repositories/PsicologoRepository.js';
import { DisponibilidadDTO } from '../dto/OtherDTO.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';
import { validateUUID } from '../utils/validationUtils.js';

export class DisponibilidadService {
    constructor() {
        this.disponibilidadRepository = new DisponibilidadRepository();
        this.psicologoRepository = new PsicologoRepository();
    }
    
    async getAllDisponibilidades() {
        try {
            const disponibilidades = await this.disponibilidadRepository.findAllWithPsicologos();
            return createSuccessResponse(DisponibilidadDTO.fromArray(disponibilidades));
        } catch (error) {
            throw createErrorResponse('Error retrieving availabilities', 500, error.message);
        }
    }
    
    async getDisponibilidadesByPsicologo(psicologoId, currentUser) {
        try {
            if (!validateUUID(psicologoId)) {
                throw createErrorResponse('Invalid psychologist ID format', 400);
            }
            
            // Authorization check
            if (!this.isAuthorizedToViewDisponibilidad(currentUser, psicologoId)) {
                throw createErrorResponse('Access denied', 403);
            }
            
            const disponibilidades = await this.disponibilidadRepository.findByPsicologoId(psicologoId);
            
            return createSuccessResponse(DisponibilidadDTO.fromArray(disponibilidades));
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error retrieving psychologist availabilities', 500, error.message);
        }
    }
    
    async getDisponibilidadesActivasByPsicologo(psicologoId) {
        try {
            if (!validateUUID(psicologoId)) {
                throw createErrorResponse('Invalid psychologist ID format', 400);
            }
            
            const disponibilidades = await this.disponibilidadRepository.findActivasByPsicologoId(psicologoId);
            
            return createSuccessResponse(DisponibilidadDTO.fromArray(disponibilidades));
        } catch (error) {
            throw createErrorResponse('Error retrieving active availabilities', 500, error.message);
        }
    }
    
    async createDisponibilidad(disponibilidadData, currentUser) {
        try {
            const { idPsicologo, diaSemana, horaInicio, horaFin } = disponibilidadData;
            
            if (!validateUUID(idPsicologo)) {
                throw createErrorResponse('Invalid psychologist ID format', 400);
            }
            
            // Authorization check
            if (!this.isAuthorizedToModifyDisponibilidad(currentUser, idPsicologo)) {
                throw createErrorResponse('Access denied', 403);
            }
            
            // Verify psychologist exists
            const psicologo = await this.psicologoRepository.findById(idPsicologo);
            if (!psicologo) {
                throw createErrorResponse('Psychologist not found', 404);
            }
            
            // Validate time range
            if (!this.isValidTimeRange(horaInicio, horaFin)) {
                throw createErrorResponse('Invalid time range - End time must be after start time', 400);
            }
            
            // Check for conflicting schedules
            const conflictingSchedules = await this.disponibilidadRepository.findConflictingSchedule(
                idPsicologo, diaSemana, horaInicio, horaFin
            );
            
            if (conflictingSchedules.length > 0) {
                throw createErrorResponse('Schedule conflict detected - Overlapping availability exists', 409);
            }
            
            const disponibilidad = await this.disponibilidadRepository.create({
                idPsicologo,
                diaSemana,
                horaInicio,
                horaFin,
                activa: disponibilidadData.activa !== undefined ? disponibilidadData.activa : true
            });
            
            return createSuccessResponse(new DisponibilidadDTO(disponibilidad), 201);
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error creating availability', 500, error.message);
        }
    }
    
    async updateDisponibilidad(id, updateData, currentUser) {
        try {
            if (!validateUUID(id)) {
                throw createErrorResponse('Invalid availability ID format', 400);
            }
            
            const disponibilidad = await this.disponibilidadRepository.findById(id);
            if (!disponibilidad) {
                throw createErrorResponse('Availability not found', 404);
            }
            
            // Authorization check
            if (!this.isAuthorizedToModifyDisponibilidad(currentUser, disponibilidad.idPsicologo)) {
                throw createErrorResponse('Access denied', 403);
            }
            
            // Validate time range if provided
            const horaInicio = updateData.horaInicio || disponibilidad.horaInicio;
            const horaFin = updateData.horaFin || disponibilidad.horaFin;
            
            if (!this.isValidTimeRange(horaInicio, horaFin)) {
                throw createErrorResponse('Invalid time range - End time must be after start time', 400);
            }
            
            // Check for conflicting schedules (excluding current record)
            const diaSemana = updateData.diaSemana || disponibilidad.diaSemana;
            const conflictingSchedules = await this.disponibilidadRepository.findConflictingSchedule(
                disponibilidad.idPsicologo, diaSemana, horaInicio, horaFin, id
            );
            
            if (conflictingSchedules.length > 0) {
                throw createErrorResponse('Schedule conflict detected - Overlapping availability exists', 409);
            }
            
            await this.disponibilidadRepository.update(id, updateData);
            const updatedDisponibilidad = await this.disponibilidadRepository.findById(id);
            
            return createSuccessResponse(new DisponibilidadDTO(updatedDisponibilidad));
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error updating availability', 500, error.message);
        }
    }
    
    async deleteDisponibilidad(id, currentUser) {
        try {
            if (!validateUUID(id)) {
                throw createErrorResponse('Invalid availability ID format', 400);
            }
            
            const disponibilidad = await this.disponibilidadRepository.findById(id);
            if (!disponibilidad) {
                throw createErrorResponse('Availability not found', 404);
            }
            
            // Authorization check
            if (!this.isAuthorizedToModifyDisponibilidad(currentUser, disponibilidad.idPsicologo)) {
                throw createErrorResponse('Access denied', 403);
            }
            
            await this.disponibilidadRepository.delete(id);
            
            return createSuccessResponse({ message: 'Availability deleted successfully' });
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error deleting availability', 500, error.message);
        }
    }
    
    async toggleDisponibilidad(id, currentUser) {
        try {
            if (!validateUUID(id)) {
                throw createErrorResponse('Invalid availability ID format', 400);
            }
            
            const disponibilidad = await this.disponibilidadRepository.findById(id);
            if (!disponibilidad) {
                throw createErrorResponse('Availability not found', 404);
            }
            
            // Authorization check
            if (!this.isAuthorizedToModifyDisponibilidad(currentUser, disponibilidad.idPsicologo)) {
                throw createErrorResponse('Access denied', 403);
            }
            
            await this.disponibilidadRepository.update(id, { activa: !disponibilidad.activa });
            const updatedDisponibilidad = await this.disponibilidadRepository.findById(id);
            
            return createSuccessResponse(new DisponibilidadDTO(updatedDisponibilidad));
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error toggling availability', 500, error.message);
        }
    }
    
    // Private helper methods
    isAuthorizedToViewDisponibilidad(currentUser, psicologoId) {
        // Psychologist can view their own availability
        if (currentUser.role === 'psicologo' && currentUser.userId === psicologoId) {
            return true;
        }
        
        // Admin can view all availabilities
        if (currentUser.role === 'admin') {
            return true;
        }
        
        return false;
    }
    
    isAuthorizedToModifyDisponibilidad(currentUser, psicologoId) {
        // Psychologist can modify their own availability
        if (currentUser.role === 'psicologo' && currentUser.userId === psicologoId) {
            return true;
        }
        
        // Admin can modify all availabilities
        if (currentUser.role === 'admin') {
            return true;
        }
        
        return false;
    }
    
    isValidTimeRange(horaInicio, horaFin) {
        const inicio = new Date(`1970-01-01T${horaInicio}`);
        const fin = new Date(`1970-01-01T${horaFin}`);
        
        return fin > inicio;
    }
}
