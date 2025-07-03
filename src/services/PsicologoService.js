import { PsicologoRepository } from '../repositories/PsicologoRepository.js';
import { SesionRepository } from '../repositories/SesionRepository.js';
import { CreatePsicologoDTO, UpdatePsicologoDTO, PsicologoResponseDTO } from '../dto/PsicologoDTO.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';
import { validateUUID } from '../utils/validationUtils.js';

/**
 * Psicologo Service
 * Aplica Service Pattern y Single Responsibility Principle
 * Contiene toda la lógica de negocio relacionada con psicólogos
 */
export class PsicologoService {
  constructor() {
    this.psicologoRepository = new PsicologoRepository();
    this.sesionRepository = new SesionRepository();
  }

  async getAllPsicologos() {
    try {
      const psicologos = await this.psicologoRepository.findAll();
      const psicologosDTO = psicologos.map(psicologo => new PsicologoResponseDTO(psicologo));
      return createSuccessResponse(psicologosDTO);
    } catch (error) {
      console.error('Error in PsicologoService.getAllPsicologos:', error);
      return createErrorResponse('Error getting all psychologists', 500);
    }
  }

  async getPsicologoById(id) {
    try {
      if (!validateUUID(id)) {
        return createErrorResponse('Invalid psychologist ID format', 400);
      }

      const psicologo = await this.psicologoRepository.findWithUser(id);
      if (!psicologo) {
        return createErrorResponse('Psychologist not found', 404);
      }

      return createSuccessResponse(new PsicologoResponseDTO(psicologo));
    } catch (error) {
      console.error('Error in PsicologoService.getPsicologoById:', error);
      return createErrorResponse('Error getting psychologist by ID', 500);
    }
  }

  async createPsicologo(psicologoData, user) {
    try {
      // Check if psychologist profile already exists
      const existingProfile = await this.psicologoRepository.findById(psicologoData.id);
      if (existingProfile) {
        return createErrorResponse('Psychologist profile already exists for this user', 400);
      }

      const psicologo = await this.psicologoRepository.create(psicologoData);
      return createSuccessResponse(new PsicologoResponseDTO(psicologo), 201);
    } catch (error) {
      console.error('Error in PsicologoService.createPsicologo:', error);
      return createErrorResponse('Error creating psychologist', 500);
    }
  }

  async updatePsicologo(id, psicologoData, user) {
    try {
      if (!validateUUID(id)) {
        return createErrorResponse('Invalid psychologist ID format', 400);
      }

      const existingPsicologo = await this.psicologoRepository.findById(id);
      if (!existingPsicologo) {
        return createErrorResponse('Psychologist profile not found', 404);
      }

      const psicologo = await this.psicologoRepository.update(id, psicologoData);
      return createSuccessResponse(new PsicologoResponseDTO(psicologo));
    } catch (error) {
      console.error('Error in PsicologoService.updatePsicologo:', error);
      return createErrorResponse('Error updating psychologist', 500);
    }
  }

  async deletePsicologo(id, user) {
    try {
      if (!validateUUID(id)) {
        return createErrorResponse('Invalid psychologist ID format', 400);
      }

      const existingPsicologo = await this.psicologoRepository.findById(id);
      if (!existingPsicologo) {
        return createErrorResponse('Psychologist profile not found', 404);
      }

      await this.psicologoRepository.delete(id);
      return createSuccessResponse({ message: 'Psychologist profile successfully deleted' });
    } catch (error) {
      console.error('Error in PsicologoService.deletePsicologo:', error);
      return createErrorResponse('Error deleting psychologist', 500);
    }
  }

  async getPacientesByPsicologo(psicologoId, user) {
    try {
      if (!validateUUID(psicologoId)) {
        return createErrorResponse('Invalid psychologist ID format', 400);
      }

      const psicologo = await this.psicologoRepository.findWithPacientes(psicologoId);
      if (!psicologo) {
        return createErrorResponse('Psychologist not found', 404);
      }

      return createSuccessResponse(psicologo.Pacientes || []);
    } catch (error) {
      console.error('Error in PsicologoService.getPacientesByPsicologo:', error);
      return createErrorResponse('Error getting patients by psychologist', 500);
    }
  }

  async getPacientesWithAppointments(psicologoId, user) {
    try {
      if (!validateUUID(psicologoId)) {
        return createErrorResponse('Invalid psychologist ID format', 400);
      }

      // Get all sessions for this psychologist
      const sesiones = await this.sesionRepository.findByPsicologoWithPacientes(psicologoId);
      
      // Extract unique patients from sessions
      const pacientesMap = new Map();
      
      sesiones.forEach(sesion => {
        const sesionJSON = sesion.toJSON();
        if (sesionJSON.Paciente) {
          const paciente = sesionJSON.Paciente;
          const pacienteId = paciente.id;
          
          // Merge patient data from User relationship
          const pacienteData = {
            id: pacienteId,
            first_name: paciente.User?.first_name || '',
            last_name: paciente.User?.last_name || '',
            email: paciente.User?.email || '',
            diagnostico: paciente.diagnostico || 'Sin diagnóstico registrado',
            lastAppointment: sesion.fecha
          };
          
          // If this patient is not already in the map or if this session is newer
          if (!pacientesMap.has(pacienteId) || 
              new Date(sesion.fecha) > new Date(pacientesMap.get(pacienteId).lastAppointment)) {
            pacientesMap.set(pacienteId, pacienteData);
          }
        }
      });
      
      // Convert map to array
      const pacientes = Array.from(pacientesMap.values());
      return createSuccessResponse(pacientes);
    } catch (error) {
      console.error('Error in PsicologoService.getPacientesWithAppointments:', error);
      return createErrorResponse('Error al obtener pacientes', 500);
    }
  }

  async getPacientesByPsicologoId(psicologoId) {
    try {
      console.log(`Getting patients for psychologist ID: ${psicologoId}`);
      
      if (!validateUUID(psicologoId)) {
        console.error(`Invalid psychologist ID format: ${psicologoId}`);
        return createErrorResponse('Invalid psychologist ID format', 400);
      }

      // Verificar que el psicólogo existe
      const psicologo = await this.psicologoRepository.findById(psicologoId);
      if (!psicologo) {
        console.error(`Psychologist not found with ID: ${psicologoId}`);
        return createErrorResponse('Psychologist not found', 404);
      }
      
      console.log(`Found psychologist: ${psicologo.id}`);

      // Obtener pacientes del psicólogo
      const pacientes = await this.psicologoRepository.findPacientesByPsicologoId(psicologoId);
      console.log(`Found ${pacientes.length} patients for psychologist ${psicologoId}`);
      
      // Convertir a DTO si es necesario (podemos crear un PacienteResponseDTO específico o usar un formato genérico)
      const pacientesResponse = pacientes.map(paciente => {
        // Asegurar que tenemos datos necesarios
        if (!paciente) {
          console.warn('Found null patient in results');
          return null;
        }
        
        return {
          id: paciente.id,
          diagnosticoPreliminar: paciente.diagnosticoPreliminar || '',
          motivoConsulta: paciente.motivoConsulta || '',
          diagnostico: paciente.diagnostico || '',
          user: paciente.User ? {
            name: paciente.User.name || '',
            email: paciente.User.email || '',
            telephone: paciente.User.telephone || '',
            first_name: paciente.User.first_name || '',
            last_name: paciente.User.last_name || ''
          } : { 
            name: 'Usuario', 
            email: 'sin@email.com',
            telephone: '',
            first_name: 'Paciente',
            last_name: 'Sin Nombre'
          }
        };
      }).filter(p => p !== null); // Filtrar pacientes nulos

      console.log(`Returning ${pacientesResponse.length} formatted patients`);
      return createSuccessResponse(pacientesResponse);
    } catch (error) {
      console.error('Error in PsicologoService.getPacientesByPsicologoId:', error);
      return createErrorResponse(`Error getting patients for psychologist: ${error.message}`, 500);
    }
  }
}
