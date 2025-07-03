import { IUserRepository } from '../interfaces/IRepositories.js';
import { BaseRepository } from './BaseRepository.js';
import User from '../models/User.js';

/**
 * User Repository Implementation
 * Aplica Repository Pattern y Single Responsibility Principle
 */
export class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    try {
      return await this.findOneByCondition({ email });
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  async findByRole(role) {
    try {
      return await this.findByCondition({ role });
    } catch (error) {
      throw new Error(`Error finding users by role: ${error.message}`);
    }
  }

  async emailExists(email) {
    try {
      const user = await this.findOneByCondition({ email });
      return !!user;
    } catch (error) {
      return false;
    }
  }

  async findActiveUsers() {
    try {
      return await this.findByCondition({ 
        deletedAt: null 
      });
    } catch (error) {
      throw new Error(`Error finding active users: ${error.message}`);
    }
  }

  async findByIdWithoutPassword(id) {
    try {
      return await this.model.findByPk(id, {
        attributes: { exclude: ['password'] }
      });
    } catch (error) {
      throw new Error(`Error finding user by ID without password: ${error.message}`);
    }
  }
}
