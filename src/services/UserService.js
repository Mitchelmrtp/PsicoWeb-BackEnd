import { UserRepository } from '../repositories/UserRepository.js';
import { CreateUserDTO, UpdateUserDTO, UserResponseDTO } from '../dto/UserDTO.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * User Service
 * Aplica Service Pattern y Single Responsibility Principle
 * Contiene toda la lógica de negocio relacionada con usuarios
 */
export class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAllUsers() {
    try {
      const users = await this.userRepository.findAll();
      return users.map(user => new UserResponseDTO(user));
    } catch (error) {
      throw new Error(`Error getting all users: ${error.message}`);
    }
  }

  async getUserById(id) {
    try {
      const user = await this.userRepository.findById(id);
      return new UserResponseDTO(user);
    } catch (error) {
      throw new Error(`Error getting user by ID: ${error.message}`);
    }
  }

  async createUser(userData) {
    try {
      const createUserDTO = new CreateUserDTO(userData);
      
      // Validate DTO
      const validationErrors = createUserDTO.validate();
      if (validationErrors.length > 0) {
        throw new Error(`Validation errors: ${validationErrors.join(', ')}`);
      }

      // Check if email already exists
      const emailExists = await this.userRepository.emailExists(createUserDTO.email);
      if (emailExists) {
        throw new Error('Email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createUserDTO.password, 10);
      createUserDTO.password = hashedPassword;

      const user = await this.userRepository.create(createUserDTO);
      return new UserResponseDTO(user);
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  async updateUser(id, userData) {
    try {
      const updateUserDTO = new UpdateUserDTO(userData);
      const user = await this.userRepository.update(id, updateUserDTO);
      return new UserResponseDTO(user);
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  async deleteUser(id) {
    try {
      return await this.userRepository.delete(id);
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  async authenticateUser(email, password) {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id,
          userId: user.id, // For compatibility
          email: user.email,
          role: user.role,
          userType: user.role, // For compatibility
          issuedAt: new Date().toISOString()
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        token,
        user: new UserResponseDTO(user)
      };
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async getUsersByRole(role) {
    try {
      const users = await this.userRepository.findByRole(role);
      return users.map(user => new UserResponseDTO(user));
    } catch (error) {
      throw new Error(`Error getting users by role: ${error.message}`);
    }
  }

  async changePassword(id, currentPassword, newPassword) {
    try {
      const user = await this.userRepository.findById(id);
      
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await this.userRepository.update(id, { password: hashedNewPassword });

      return true;
    } catch (error) {
      throw new Error(`Error changing password: ${error.message}`);
    }
  }
}
