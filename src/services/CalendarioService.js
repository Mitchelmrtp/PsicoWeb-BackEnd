import { CalendarioRepository, NotificacionRepository } from '../repositories/CalendarioRepository.js';
import { CalendarioDTO, NotificacionDTO } from '../dto/OtherDTO.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';
import { validateUUID } from '../utils/validationUtils.js';

export class CalendarioService {
    constructor() {
        this.calendarioRepository = new CalendarioRepository();
    }
    
    async getAllEventos() {
        try {
            const eventos = await this.calendarioRepository.findAllWithUsers();
            return createSuccessResponse(CalendarioDTO.fromArray(eventos));
        } catch (error) {
            throw createErrorResponse('Error retrieving calendar events', 500, error.message);
        }
    }
    
    async getEventosByUsuario(usuarioId, currentUser) {
        try {
            if (!validateUUID(usuarioId)) {
                throw createErrorResponse('Invalid user ID format', 400);
            }
            
            // Authorization check
            if (!this.isAuthorizedToViewCalendar(currentUser, usuarioId)) {
                throw createErrorResponse('Access denied', 403);
            }
            
            const eventos = await this.calendarioRepository.findByUsuarioId(usuarioId);
            
            return createSuccessResponse(CalendarioDTO.fromArray(eventos));
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error retrieving user calendar events', 500, error.message);
        }
    }
    
    async getEventosByDateRange(fechaInicio, fechaFin, usuarioId = null, currentUser) {
        try {
            // Authorization check
            if (usuarioId && !this.isAuthorizedToViewCalendar(currentUser, usuarioId)) {
                throw createErrorResponse('Access denied', 403);
            }
            
            const eventos = await this.calendarioRepository.findByDateRange(fechaInicio, fechaFin, usuarioId);
            
            return createSuccessResponse(CalendarioDTO.fromArray(eventos));
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error retrieving calendar events by date range', 500, error.message);
        }
    }
    
    async createEvento(eventoData, currentUser) {
        try {
            const { idUsuario } = eventoData;
            
            if (!validateUUID(idUsuario)) {
                throw createErrorResponse('Invalid user ID format', 400);
            }
            
            // Authorization check
            if (!this.isAuthorizedToModifyCalendar(currentUser, idUsuario)) {
                throw createErrorResponse('Access denied', 403);
            }
            
            // Validate dates
            if (new Date(eventoData.fechaFin) <= new Date(eventoData.fechaInicio)) {
                throw createErrorResponse('End date must be after start date', 400);
            }
            
            const evento = await this.calendarioRepository.create(eventoData);
            
            return createSuccessResponse(new CalendarioDTO(evento), 201);
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error creating calendar event', 500, error.message);
        }
    }
    
    async updateEvento(id, updateData, currentUser) {
        try {
            if (!validateUUID(id)) {
                throw createErrorResponse('Invalid event ID format', 400);
            }
            
            const evento = await this.calendarioRepository.findById(id);
            if (!evento) {
                throw createErrorResponse('Calendar event not found', 404);
            }
            
            // Authorization check
            if (!this.isAuthorizedToModifyCalendar(currentUser, evento.idUsuario)) {
                throw createErrorResponse('Access denied', 403);
            }
            
            // Validate dates if provided
            const fechaInicio = updateData.fechaInicio || evento.fechaInicio;
            const fechaFin = updateData.fechaFin || evento.fechaFin;
            
            if (new Date(fechaFin) <= new Date(fechaInicio)) {
                throw createErrorResponse('End date must be after start date', 400);
            }
            
            await this.calendarioRepository.update(id, updateData);
            const updatedEvento = await this.calendarioRepository.findById(id);
            
            return createSuccessResponse(new CalendarioDTO(updatedEvento));
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error updating calendar event', 500, error.message);
        }
    }
    
    async deleteEvento(id, currentUser) {
        try {
            if (!validateUUID(id)) {
                throw createErrorResponse('Invalid event ID format', 400);
            }
            
            const evento = await this.calendarioRepository.findById(id);
            if (!evento) {
                throw createErrorResponse('Calendar event not found', 404);
            }
            
            // Authorization check
            if (!this.isAuthorizedToModifyCalendar(currentUser, evento.idUsuario)) {
                throw createErrorResponse('Access denied', 403);
            }
            
            await this.calendarioRepository.delete(id);
            
            return createSuccessResponse({ message: 'Calendar event deleted successfully' });
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error deleting calendar event', 500, error.message);
        }
    }
    
    // Private helper methods
    isAuthorizedToViewCalendar(currentUser, usuarioId) {
        // User can view their own calendar
        if (currentUser.userId === usuarioId) return true;
        
        // Admin can view all calendars
        if (currentUser.role === 'admin') return true;
        
        return false;
    }
    
    isAuthorizedToModifyCalendar(currentUser, usuarioId) {
        // User can modify their own calendar
        if (currentUser.userId === usuarioId) return true;
        
        // Admin can modify all calendars
        if (currentUser.role === 'admin') return true;
        
        return false;
    }
}

export class NotificacionService {
    constructor() {
        this.notificacionRepository = new NotificacionRepository();
    }
    
    async getNotificacionesByUsuario(usuarioId, currentUser) {
        try {
            if (!validateUUID(usuarioId)) {
                throw createErrorResponse('Invalid user ID format', 400);
            }
            
            // Authorization check
            if (!this.isAuthorizedToViewNotifications(currentUser, usuarioId)) {
                throw createErrorResponse('Access denied', 403);
            }
            
            const notificaciones = await this.notificacionRepository.findByUsuarioId(usuarioId);
            
            return createSuccessResponse(NotificacionDTO.fromArray(notificaciones));
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error retrieving notifications', 500, error.message);
        }
    }
    
    async getNotificacionesNoLeidas(usuarioId, currentUser) {
        try {
            if (!validateUUID(usuarioId)) {
                throw createErrorResponse('Invalid user ID format', 400);
            }
            
            // Authorization check
            if (!this.isAuthorizedToViewNotifications(currentUser, usuarioId)) {
                throw createErrorResponse('Access denied', 403);
            }
            
            const notificaciones = await this.notificacionRepository.findNoLeidasByUsuarioId(usuarioId);
            
            return createSuccessResponse(NotificacionDTO.fromArray(notificaciones));
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error retrieving unread notifications', 500, error.message);
        }
    }
    
    async createNotificacion(notificacionData) {
        try {
            const { idUsuario } = notificacionData;
            
            if (!validateUUID(idUsuario)) {
                throw createErrorResponse('Invalid user ID format', 400);
            }
            
            const notificacion = await this.notificacionRepository.create({
                ...notificacionData,
                leida: false,
                fechaCreacion: new Date()
            });
            
            return createSuccessResponse(new NotificacionDTO(notificacion), 201);
        } catch (error) {
            throw createErrorResponse('Error creating notification', 500, error.message);
        }
    }
    
    async markAsRead(id, currentUser) {
        try {
            if (!validateUUID(id)) {
                throw createErrorResponse('Invalid notification ID format', 400);
            }
            
            const notificacion = await this.notificacionRepository.findById(id);
            if (!notificacion) {
                throw createErrorResponse('Notification not found', 404);
            }
            
            // Authorization check
            if (!this.isAuthorizedToModifyNotification(currentUser, notificacion.idUsuario)) {
                throw createErrorResponse('Access denied', 403);
            }
            
            await this.notificacionRepository.markAsRead(id, currentUser.userId);
            
            return createSuccessResponse({ message: 'Notification marked as read' });
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error marking notification as read', 500, error.message);
        }
    }
    
    async markAllAsRead(usuarioId, currentUser) {
        try {
            if (!validateUUID(usuarioId)) {
                throw createErrorResponse('Invalid user ID format', 400);
            }
            
            // Authorization check
            if (!this.isAuthorizedToModifyNotification(currentUser, usuarioId)) {
                throw createErrorResponse('Access denied', 403);
            }
            
            await this.notificacionRepository.markAllAsRead(usuarioId);
            
            return createSuccessResponse({ message: 'All notifications marked as read' });
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error marking all notifications as read', 500, error.message);
        }
    }
    
    async getUnreadCount(usuarioId, currentUser) {
        try {
            if (!validateUUID(usuarioId)) {
                throw createErrorResponse('Invalid user ID format', 400);
            }
            
            // Authorization check
            if (!this.isAuthorizedToViewNotifications(currentUser, usuarioId)) {
                throw createErrorResponse('Access denied', 403);
            }
            
            const count = await this.notificacionRepository.countNoLeidas(usuarioId);
            
            return createSuccessResponse({ count });
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error retrieving unread count', 500, error.message);
        }
    }
    
    // Private helper methods
    isAuthorizedToViewNotifications(currentUser, usuarioId) {
        // User can view their own notifications
        if (currentUser.userId === usuarioId) return true;
        
        // Admin can view all notifications
        if (currentUser.role === 'admin') return true;
        
        return false;
    }
    
    isAuthorizedToModifyNotification(currentUser, usuarioId) {
        // User can modify their own notifications
        if (currentUser.userId === usuarioId) return true;
        
        // Admin can modify all notifications
        if (currentUser.role === 'admin') return true;
        
        return false;
    }
}
