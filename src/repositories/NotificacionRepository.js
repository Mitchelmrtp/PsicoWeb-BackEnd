import { INotificacionRepository } from '../interfaces/IRepositories.js';
import { BaseRepository } from './BaseRepository.js';
import Notificacion from '../models/Notificacion.js';
import User from '../models/User.js';

/**
 * Notificacion Repository Implementation
 * Aplica Repository Pattern y Single Responsibility Principle
 */
export class NotificacionRepository extends BaseRepository {
  constructor() {
    super(Notificacion);
  }

  async findByUserId(userId, options = {}) {
    try {
      return await this.findByCondition(
        { idUsuario: userId },
        {
          include: [{
            model: User,
            attributes: ['name', 'email', 'first_name', 'last_name']
          }],
          order: [['createdAt', 'DESC']],
          ...options
        }
      );
    } catch (error) {
      throw new Error(`Error finding notifications by user ID: ${error.message}`);
    }
  }

  async findUnreadByUserId(userId, options = {}) {
    try {
      return await this.findByCondition(
        { 
          idUsuario: userId,
          leido: false 
        },
        {
          order: [['createdAt', 'DESC']],
          ...options
        }
      );
    } catch (error) {
      throw new Error(`Error finding unread notifications by user ID: ${error.message}`);
    }
  }

  async markAsRead(id) {
    try {
      return await this.update(id, { leido: true });
    } catch (error) {
      throw new Error(`Error marking notification as read: ${error.message}`);
    }
  }

  async markAllAsReadByUserId(userId) {
    try {
      const notifications = await this.findByCondition({ 
        idUsuario: userId,
        leido: false 
      });
      
      const updatePromises = notifications.map(notification => 
        this.update(notification.id, { leido: true })
      );
      
      return await Promise.all(updatePromises);
    } catch (error) {
      throw new Error(`Error marking all notifications as read: ${error.message}`);
    }
  }

  async findByType(tipo, options = {}) {
    try {
      return await this.findByCondition(
        { tipo },
        {
          order: [['createdAt', 'DESC']],
          ...options
        }
      );
    } catch (error) {
      throw new Error(`Error finding notifications by type: ${error.message}`);
    }
  }

  async deleteOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const oldNotifications = await this.findByCondition({
        createdAt: {
          [this.sequelize.Op.lt]: cutoffDate
        }
      });
      
      const deletePromises = oldNotifications.map(notification => 
        this.delete(notification.id)
      );
      
      return await Promise.all(deletePromises);
    } catch (error) {
      throw new Error(`Error deleting old notifications: ${error.message}`);
    }
  }
}
