/**
 * User Data Transfer Objects
 * Aplica el principio de Single Responsibility (SOLID)
 */

export class CreateUserDTO {
  constructor(data) {
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.telephone = data.telephone;
    this.role = data.role;
  }

  validate() {
    const errors = [];
    
    if (!this.email) errors.push('Email is required');
    if (!this.password) errors.push('Password is required');
    if (!this.role) errors.push('Role is required');
    
    return errors;
  }
}

export class UpdateUserDTO {
  constructor(data) {
    this.name = data.name;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.telephone = data.telephone;
  }
}

export class UserResponseDTO {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.telephone = user.telephone;
    this.role = user.role;
    this.created_at = user.created_at;
    this.modified_at = user.modified_at;
  }
}
