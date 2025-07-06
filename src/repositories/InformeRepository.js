// src/repositories/InformeRepository.js
import { BaseRepository } from './BaseRepository.js';
import Informe from '../models/Informe.js';

export class InformeRepository extends BaseRepository {
  constructor() {
    super(Informe);
  }

  /**
   * Devuelve todos los informes, ordenados por fecha de sesión descendente
   */
  async findAllByFechaSesion() {
    return await this.model.findAll({
      order: [['fecha_sesion', 'DESC']],
    });
  }
}
