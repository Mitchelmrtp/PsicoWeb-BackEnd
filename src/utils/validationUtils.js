/**
 * Validation Utilities
 * Aplica Single Responsibility Principle
 */

export class ValidationUtils {
  static isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidDate(date) {
    return date instanceof Date && !isNaN(date);
  }

  static isValidTime(time) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  static isValidEstado(estado) {
    const validEstados = ['programada', 'completada', 'cancelada'];
    return validEstados.includes(estado);
  }

  static isValidRole(role) {
    const validRoles = ['admin', 'psicologo', 'paciente'];
    return validRoles.includes(role);
  }

  static sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str.trim();
  }

  static validateRequired(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      throw new Error(`${fieldName} is required`);
    }
  }

  static validateUUID(uuid, fieldName = 'ID') {
    this.validateRequired(uuid, fieldName);
    if (!this.isValidUUID(uuid)) {
      throw new Error(`${fieldName} must be a valid UUID`);
    }
  }

  static validateEmail(email) {
    this.validateRequired(email, 'Email');
    if (!this.isValidEmail(email)) {
      throw new Error('Email must be a valid email address');
    }
  }

  static validateDate(date, fieldName = 'Date') {
    this.validateRequired(date, fieldName);
    const parsedDate = new Date(date);
    if (!this.isValidDate(parsedDate)) {
      throw new Error(`${fieldName} must be a valid date`);
    }
  }

  static validateTime(time, fieldName = 'Time') {
    this.validateRequired(time, fieldName);
    if (!this.isValidTime(time)) {
      throw new Error(`${fieldName} must be in HH:MM format`);
    }
  }

  static validateEstado(estado) {
    this.validateRequired(estado, 'Estado');
    if (!this.isValidEstado(estado)) {
      throw new Error('Estado must be one of: programada, completada, cancelada');
    }
  }

  static validateRole(role) {
    this.validateRequired(role, 'Role');
    if (!this.isValidRole(role)) {
      throw new Error('Role must be one of: admin, psicologo, paciente');
    }
  }
}

/**
 * Direct utility functions for easy import
 */
export const validateUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

export const validateTime = (time) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

export const validateEstado = (estado) => {
  const validEstados = ['programada', 'completada', 'cancelada'];
  return validEstados.includes(estado);
};

export const validateRole = (role) => {
  const validRoles = ['admin', 'psicologo', 'paciente'];
  return validRoles.includes(role);
};
