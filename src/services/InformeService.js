// src/services/InformeService.js
import { InformeRepository } from '../repositories/InformeRepository.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';
import { validateUUID } from '../utils/validationUtils.js';

export class InformeService {
  constructor() {
    this.repo = new InformeRepository();
  }

  async getAllInformes() {
    try {
      const informes = await this.repo.findAllByFechaSesion();
      return createSuccessResponse(informes);
    } catch (err) {
      throw createErrorResponse('Error fetching informes', 500, err.message);
    }
  }

  async getInformeById(id) {
    try {
      if (!validateUUID(id)) {
        throw createErrorResponse('Invalid informe ID', 400);
      }
      const informe = await this.repo.findByPk(id);
      if (!informe) {
        throw createErrorResponse('Informe not found', 404);
      }
      return createSuccessResponse(informe);
    } catch (err) {
      if (err.statusCode) throw err;
      throw createErrorResponse('Error fetching informe', 500, err.message);
    }
  }

  async createInforme(data) {
    try {
      const nuevo = await this.repo.create(data);
      return createSuccessResponse(nuevo, 201);
    } catch (err) {
      throw createErrorResponse('Error creating informe', 500, err.message);
    }
  }

  async updateInforme(id, data) {
    try {
      if (!validateUUID(id)) {
        throw createErrorResponse('Invalid informe ID', 400);
      }
      const existente = await this.repo.findByPk(id);
      if (!existente) {
        throw createErrorResponse('Informe not found', 404);
      }
      await this.repo.update(id, data);
      const actualizado = await this.repo.findByPk(id);
      return createSuccessResponse(actualizado);
    } catch (err) {
      if (err.statusCode) throw err;
      throw createErrorResponse('Error updating informe', 500, err.message);
    }
  }

  async deleteInforme(id) {
    try {
      if (!validateUUID(id)) {
        throw createErrorResponse('Invalid informe ID', 400);
      }
      const existente = await this.repo.findByPk(id);
      if (!existente) {
        throw createErrorResponse('Informe not found', 404);
      }
      await this.repo.delete(id);
      return createSuccessResponse({ message: 'Informe deleted' });
    } catch (err) {
      if (err.statusCode) throw err;
      throw createErrorResponse('Error deleting informe', 500, err.message);
    }
  }
}
