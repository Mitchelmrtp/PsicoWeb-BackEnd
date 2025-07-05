import { ISesionRepository } from "../interfaces/IRepositories.js";
import { BaseRepository } from "./BaseRepository.js";
import Sesion from "../models/Sesion.js";
import Psicologo from "../models/Psicologo.js";
import Paciente from "../models/Paciente.js";
import User from "../models/User.js";
import { Op } from "sequelize";

/**
 * Sesion Repository Implementation
 * Aplica Repository Pattern y Single Responsibility Principle
 */
export class SesionRepository extends BaseRepository {
  constructor() {
    super(Sesion);
  }

  async findByPsicologoId(psicologoId, options = {}) {
    try {
      return await this.findByCondition(
        { idPsicologo: psicologoId },
        {
          include: this._getDefaultIncludes(),
          order: [["fecha", "DESC"]],
          ...options,
        }
      );
    } catch (error) {
      throw new Error(
        `Error finding sessions by psychologist: ${error.message}`
      );
    }
  }

  async findByPacienteId(pacienteId, options = {}) {
    try {
      return await this.findByCondition(
        { idPaciente: pacienteId },
        {
          include: this._getDefaultIncludes(),
          order: [["fecha", "ASC"]],
          ...options,
        }
      );
    } catch (error) {
      throw new Error(`Error finding sessions by patient: ${error.message}`);
    }
  }

  async findByDateRange(startDate, endDate, options = {}) {
    try {
      const dateCondition = {};

      if (startDate && endDate) {
        dateCondition.fecha = { [Op.between]: [startDate, endDate] };
      } else if (startDate) {
        dateCondition.fecha = { [Op.gte]: startDate };
      } else if (endDate) {
        dateCondition.fecha = { [Op.lte]: endDate };
      }

      return await this.findByCondition(dateCondition, {
        include: this._getDefaultIncludes(),
        order: [["fecha", "ASC"]],
        ...options,
      });
    } catch (error) {
      throw new Error(`Error finding sessions by date range: ${error.message}`);
    }
  }

  async findByEstado(estado, options = {}) {
    try {
      return await this.findByCondition(
        { estado },
        {
          include: this._getDefaultIncludes(),
          ...options,
        }
      );
    } catch (error) {
      throw new Error(`Error finding sessions by status: ${error.message}`);
    }
  }

  async findWithFilters(filters = {}, options = {}) {
    try {
      const where = {};

      // Apply direct ID filters
      if (filters.idPsicologo) {
        where.idPsicologo = filters.idPsicologo;
      }

      if (filters.idPaciente) {
        where.idPaciente = filters.idPaciente;
      }

      // Apply date filters
      if (filters.startDate || filters.endDate) {
        const dateCondition = {};
        if (filters.startDate && filters.endDate) {
          dateCondition.fecha = {
            [Op.between]: [filters.startDate, filters.endDate],
          };
        } else if (filters.startDate) {
          dateCondition.fecha = { [Op.gte]: filters.startDate };
        } else if (filters.endDate) {
          dateCondition.fecha = { [Op.lte]: filters.endDate };
        }
        Object.assign(where, dateCondition);
      }

      // Apply status filter
      if (filters.estado) {
        where.estado = filters.estado;
      }

      return await this.findByCondition(where, {
        include: this._getDefaultIncludes(),
        order: [["fecha", "ASC"]],
        ...options,
      });
    } catch (error) {
      throw new Error(`Error finding sessions with filters: ${error.message}`);
    }
  }

  async findById(id, options = {}) {
    try {
      return await super.findById(id, {
        include: this._getDefaultIncludes(),
        ...options,
      });
    } catch (error) {
      throw new Error(`Error finding session by ID: ${error.message}`);
    }
  }

  async findAll(options = {}) {
    try {
      return await super.findAll({
        include: this._getDefaultIncludes(),
        order: [["fecha", "ASC"]],
        ...options,
      });
    } catch (error) {
      throw new Error(`Error finding all sessions: ${error.message}`);
    }
  }

  async findByPsicologoWithPacientes(psicologoId, options = {}) {
    try {
      return await this.findByCondition(
        { idPsicologo: psicologoId },
        {
          include: [
            {
              model: Paciente,
              attributes: ["id", "diagnostico"],
              include: [
                {
                  model: User,
                  attributes: ["first_name", "last_name", "email"],
                },
              ],
            },
          ],
          attributes: ["id", "fecha", "estado"],
          order: [["fecha", "DESC"]],
          ...options,
        }
      );
    } catch (error) {
      throw new Error(
        `Error finding sessions by psychologist with patients: ${error.message}`
      );
    }
  }

  _getDefaultIncludes() {
    return [
      {
        model: Psicologo,
        include: [
          {
            model: User,
            attributes: ["name", "first_name", "last_name", "email"],
          },
        ],
      },
      {
        model: Paciente,
        include: [
          {
            model: User,
            attributes: ["name", "first_name", "last_name", "email"],
          },
        ],
      },
    ];
  }
}
