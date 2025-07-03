/**
 * Controller Factory
 * Implementa Factory Pattern y Dependency Injection
 */

import container from '../config/dependencies.js';

// Import controllers
import * as authController from '../controllers/authController.js';
import * as sesionController from '../controllers/sesionController.js';
import * as psicologoController from '../controllers/psicologoController.js';
import * as pacienteController from '../controllers/pacienteController.js';
import * as pruebaController from '../controllers/pruebaController.js';
import * as disponibilidadController from '../controllers/disponibilidadPsicologoController.js';
import * as calendarioController from '../controllers/calendarioController.js';
import * as notificacionController from '../controllers/notificacionController.js';
import * as passwordController from '../controllers/passwordController.js';

class ControllerFactory {
    constructor() {
        this.controllers = new Map();
        this.initializeControllers();
    }

    initializeControllers() {
        // Map controllers to their names
        this.controllers.set('auth', authController);
        this.controllers.set('sesion', sesionController);
        this.controllers.set('psicologo', psicologoController);
        this.controllers.set('paciente', pacienteController);
        this.controllers.set('prueba', pruebaController);
        this.controllers.set('disponibilidad', disponibilidadController);
        this.controllers.set('calendario', calendarioController);
        this.controllers.set('notificacion', notificacionController);
        this.controllers.set('password', passwordController);
    }

    getController(name) {
        const controller = this.controllers.get(name);
        if (!controller) {
            throw new Error(`Controller '${name}' not found`);
        }
        return controller;
    }

    // Method to get service for a controller
    getServiceForController(controllerName) {
        const serviceMap = {
            'auth': 'user',
            'sesion': 'sesion',
            'psicologo': 'psicologo',
            'paciente': 'paciente',
            'prueba': 'prueba',
            'disponibilidad': 'disponibilidad',
            'calendario': 'calendario',
            'notificacion': 'notificacion',
            'password': 'password'
        };

        const serviceName = serviceMap[controllerName];
        if (!serviceName) {
            throw new Error(`No service mapping found for controller '${controllerName}'`);
        }

        return container.getService(serviceName);
    }

    // Helper method to inject services into controllers if needed
    injectDependencies(controllerName, dependencies = {}) {
        const controller = this.getController(controllerName);
        const service = this.getServiceForController(controllerName);
        
        // If controller has an init method, call it with dependencies
        if (controller.init && typeof controller.init === 'function') {
            controller.init({ service, ...dependencies });
        }

        return controller;
    }

    getAllControllers() {
        const controllerMap = {};
        for (const [name, controller] of this.controllers) {
            controllerMap[name] = controller;
        }
        return controllerMap;
    }
}

// Singleton instance
const controllerFactory = new ControllerFactory();

export default controllerFactory;

// Export individual controllers for backward compatibility
export const getAuthController = () => controllerFactory.getController('auth');
export const getSesionController = () => controllerFactory.getController('sesion');
export const getPsicologoController = () => controllerFactory.getController('psicologo');
export const getPacienteController = () => controllerFactory.getController('paciente');
export const getPruebaController = () => controllerFactory.getController('prueba');
export const getDisponibilidadController = () => controllerFactory.getController('disponibilidad');
export const getCalendarioController = () => controllerFactory.getController('calendario');
export const getNotificacionController = () => controllerFactory.getController('notificacion');
export const getPasswordController = () => controllerFactory.getController('password');
