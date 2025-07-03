/**
 * Dependency Injection Container
 * Implementa el principio de Dependency Inversion (SOLID)
 */

// Repositories
import { UserRepository } from '../repositories/UserRepository.js';
import { SesionRepository } from '../repositories/SesionRepository.js';
import { PsicologoRepository } from '../repositories/PsicologoRepository.js';
import { PacienteRepository } from '../repositories/PacienteRepository.js';
import { PruebaRepository, PreguntaRepository, ResultadoPruebaRepository } from '../repositories/PruebaRepository.js';
import { DisponibilidadRepository } from '../repositories/DisponibilidadRepository.js';
import { CalendarioRepository, NotificacionRepository } from '../repositories/CalendarioRepository.js';

// Services
import { UserService } from '../services/UserService.js';
import { SesionService } from '../services/SesionService.js';
import { PsicologoService } from '../services/PsicologoService.js';
import { PacienteService } from '../services/PacienteService.js';
import { PruebaService } from '../services/PruebaService.js';
import { DisponibilidadService } from '../services/DisponibilidadService.js';
import { CalendarioService, NotificacionService } from '../services/CalendarioService.js';
import { PasswordService } from '../services/PasswordService.js';

class DependencyContainer {
    constructor() {
        this.repositories = {};
        this.services = {};
        this.initializeRepositories();
        this.initializeServices();
    }

    initializeRepositories() {
        this.repositories.user = new UserRepository();
        this.repositories.sesion = new SesionRepository();
        this.repositories.psicologo = new PsicologoRepository();
        this.repositories.paciente = new PacienteRepository();
        this.repositories.prueba = new PruebaRepository();
        this.repositories.pregunta = new PreguntaRepository();
        this.repositories.resultadoPrueba = new ResultadoPruebaRepository();
        this.repositories.disponibilidad = new DisponibilidadRepository();
        this.repositories.calendario = new CalendarioRepository();
        this.repositories.notificacion = new NotificacionRepository();
    }

    initializeServices() {
        this.services.user = new UserService();
        this.services.sesion = new SesionService();
        this.services.psicologo = new PsicologoService();
        this.services.paciente = new PacienteService();
        this.services.prueba = new PruebaService();
        this.services.disponibilidad = new DisponibilidadService();
        this.services.calendario = new CalendarioService();
        this.services.notificacion = new NotificacionService();
        this.services.password = new PasswordService();
    }

    getRepository(name) {
        if (!this.repositories[name]) {
            throw new Error(`Repository '${name}' not found`);
        }
        return this.repositories[name];
    }

    getService(name) {
        if (!this.services[name]) {
            throw new Error(`Service '${name}' not found`);
        }
        return this.services[name];
    }

    // Method to get all repositories for testing
    getAllRepositories() {
        return this.repositories;
    }

    // Method to get all services for testing
    getAllServices() {
        return this.services;
    }
}

// Singleton instance
const container = new DependencyContainer();

export default container;

// Export specific services for backward compatibility
export const getUserService = () => container.getService('user');
export const getSesionService = () => container.getService('sesion');
export const getPsicologoService = () => container.getService('psicologo');
export const getPacienteService = () => container.getService('paciente');
export const getPruebaService = () => container.getService('prueba');
export const getDisponibilidadService = () => container.getService('disponibilidad');
export const getCalendarioService = () => container.getService('calendario');
export const getNotificacionService = () => container.getService('notificacion');
export const getPasswordService = () => container.getService('password');

// Export specific repositories for direct access when needed
export const getUserRepository = () => container.getRepository('user');
export const getSesionRepository = () => container.getRepository('sesion');
export const getPsicologoRepository = () => container.getRepository('psicologo');
export const getPacienteRepository = () => container.getRepository('paciente');
