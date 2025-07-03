import { IBaseRepository } from '../interfaces/IRepositories.js';

/**
 * Base Repository Implementation
 * Aplica Repository Pattern y principios SOLID
 */
export class BaseRepository extends IBaseRepository {
  constructor(model) {
    super();
    this.model = model;
  }

  async findAll(options = {}) {
    try {
      return await this.model.findAll(options);
    } catch (error) {
      throw new Error(`Error finding all records: ${error.message}`);
    }
  }

  async findById(id, options = {}) {
    try {
      const record = await this.model.findByPk(id, options);
      if (!record) {
        throw new Error(`Record with ID ${id} not found`);
      }
      return record;
    } catch (error) {
      throw new Error(`Error finding record by ID: ${error.message}`);
    }
  }

  async create(data) {
    try {
      return await this.model.create(data);
    } catch (error) {
      throw new Error(`Error creating record: ${error.message}`);
    }
  }

  async update(id, data) {
    try {
      const [updatedRowCount] = await this.model.update(data, {
        where: { id },
        returning: true
      });
      
      if (updatedRowCount === 0) {
        throw new Error(`Record with ID ${id} not found`);
      }
      
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Error updating record: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const deletedRowCount = await this.model.destroy({
        where: { id }
      });
      
      if (deletedRowCount === 0) {
        throw new Error(`Record with ID ${id} not found`);
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error deleting record: ${error.message}`);
    }
  }

  async findByCondition(condition, options = {}) {
    try {
      return await this.model.findAll({
        where: condition,
        ...options
      });
    } catch (error) {
      throw new Error(`Error finding records by condition: ${error.message}`);
    }
  }

  async findOneByCondition(condition, options = {}) {
    try {
      return await this.model.findOne({
        where: condition,
        ...options
      });
    } catch (error) {
      throw new Error(`Error finding record by condition: ${error.message}`);
    }
  }

  async count(condition = {}) {
    try {
      return await this.model.count({ where: condition });
    } catch (error) {
      throw new Error(`Error counting records: ${error.message}`);
    }
  }
}
