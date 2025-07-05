import { IPsicologoRepository } from '../interfaces/IRepositories.js';
import { BaseRepository } from './BaseRepository.js';
import Psicologo from '../models/Psicologo.js';
import User from '../models/User.js';

/**
 * Psicologo Repository Implementation
 * Aplica Repository Pattern y Single Responsibility Principle
 */
export class PsicologoRepository extends BaseRepository {
  constructor() {
    super(Psicologo);
  }

  async findWithUser(id) {
    try {
      return await this.findById(id, {
        include: [{
          model: User,
          as: 'User',
          attributes: ['name', 'email', 'telephone', 'first_name', 'last_name']
        }]
      });
    } catch (error) {
      throw new Error(`Error finding psychologist with user data: ${error.message}`);
    }
  }

  async findByEspecialidad(especialidad) {
    try {
      return await this.findByCondition(
        { especialidad },
        {
          include: [{
            model: User,
            as: 'User',
            attributes: ['name', 'email', 'telephone', 'first_name', 'last_name']
          }]
        }
      );
    } catch (error) {
      throw new Error(`Error finding psychologists by specialty: ${error.message}`);
    }
  }

  async findAll(options = {}) {
    try {
      return await super.findAll({
        include: [{
          model: User,
          as: 'User',
          attributes: ['name', 'email', 'telephone', 'first_name', 'last_name']
        }],
        ...options
      });
    } catch (error) {
      throw new Error(`Error finding all psychologists: ${error.message}`);
    }
  }

  async findById(id, options = {}) {
    try {
      return await super.findById(id, {
        include: [{
          model: User,
          as: 'User',
          attributes: ['name', 'email', 'telephone', 'first_name', 'last_name']
        }],
        ...options
      });
    } catch (error) {
      throw new Error(`Error finding psychologist by ID: ${error.message}`);
    }
  }

  async existsById(id) {
    try {
      const psicologo = await this.findOneByCondition({ id });
      return !!psicologo;
    } catch (error) {
      return false;
    }
  }

  async findWithPacientes(id) {
    try {
      const Paciente = (await import('../models/Paciente.js')).default;
      return await this.findById(id, {
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['name', 'email', 'telephone', 'first_name', 'last_name']
          },
          {
            model: Paciente,
            include: [{
              model: User,
              as: 'User',
              attributes: ['name', 'email', 'first_name', 'last_name', 'telephone']
            }]
          }
        ]
      });
    } catch (error) {
      throw new Error(`Error finding psychologist with patients: ${error.message}`);
    }
  }

  async findPacientesByPsicologoId(psicologoId) {
    try {
      console.log(`Repository: Finding patients for psychologist ID: ${psicologoId}`);
      
      // Importar Paciente dinámicamente para evitar importaciones circulares
      const { Paciente } = await import('../models/index.js');
      
      if (!Paciente) {
        console.error('Failed to import Paciente model');
        throw new Error('Failed to import Paciente model');
      }
      
      // Buscar todos los pacientes asignados a este psicólogo
      const patients = await Paciente.findAll({
        where: { idPsicologo: psicologoId },
        include: [{
          model: User,
          as: 'User',
          attributes: ['name', 'email', 'telephone', 'first_name', 'last_name']
        }]
      });
      
      console.log(`Repository: Found ${patients.length} patients for psychologist ${psicologoId}`);
      
      // Registrar cada paciente para depuración
      patients.forEach((p, i) => {
        console.log(`Repository: Patient ${i+1}: ID=${p.id}, User=${p.User?.email || 'No user'}`);
      });
      
      return patients;
    } catch (error) {
      console.error(`Repository error finding patients for psychologist: ${error.message}`);
      throw new Error(`Error finding patients for psychologist: ${error.message}`);
    }
  }
}
