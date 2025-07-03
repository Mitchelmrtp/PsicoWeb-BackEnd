import { IPacienteRepository } from '../interfaces/IRepositories.js';
import { BaseRepository } from './BaseRepository.js';
import Paciente from '../models/Paciente.js';
import User from '../models/User.js';

/**
 * Paciente Repository Implementation
 * Aplica Repository Pattern y Single Responsibility Principle
 */
export class PacienteRepository extends BaseRepository {
  constructor() {
    super(Paciente);
  }

  async findByPsicologoId(psicologoId) {
    try {
      return await this.findByCondition(
        { idPsicologo: psicologoId },
        {
          include: [{
            model: User,
            attributes: ['name', 'email', 'telephone', 'first_name', 'last_name']
          }]
        }
      );
    } catch (error) {
      throw new Error(`Error finding patients by psychologist: ${error.message}`);
    }
  }

  async findWithUser(id) {
    try {
      return await this.findById(id, {
        include: [{
          model: User,
          attributes: ['name', 'email', 'telephone', 'first_name', 'last_name']
        }]
      });
    } catch (error) {
      throw new Error(`Error finding patient with user data: ${error.message}`);
    }
  }

  async findAll(options = {}) {
    try {
      return await super.findAll({
        include: [{
          model: User,
          attributes: ['name', 'email', 'telephone', 'first_name', 'last_name']
        }],
        ...options
      });
    } catch (error) {
      throw new Error(`Error finding all patients: ${error.message}`);
    }
  }

  async findById(id, options = {}) {
    try {
      return await this.model.findByPk(id, {
        include: [{
          model: User,
          attributes: ['name', 'email', 'telephone', 'first_name', 'last_name']
        }],
        ...options
      });
    } catch (error) {
      throw new Error(`Error finding patient by ID: ${error.message}`);
    }
  }

  async existsById(id) {
    try {
      const paciente = await this.model.findByPk(id);
      return !!paciente;
    } catch (error) {
      return false;
    }
  }

  async findByIdSafe(id, options = {}) {
    try {
      return await this.model.findByPk(id, {
        include: [{
          model: User,
          attributes: ['name', 'email', 'telephone', 'first_name', 'last_name']
        }],
        ...options
      });
    } catch (error) {
      throw new Error(`Error finding patient by ID: ${error.message}`);
    }
  }
}
