import { BaseRepository } from './BaseRepository.js';
import { Mensaje, User, Chat } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Mensaje Repository Implementation
 * Aplica Repository Pattern y Single Responsibility Principle
 * Maneja todas las operaciones de base de datos relacionadas con mensajes
 */
export class MensajeRepository extends BaseRepository {
    constructor() {
        super(Mensaje);
    }

    async findMessagesByChat(chatId, options = {}) {
        try {
            const { page = 1, limit = 50, order = 'ASC' } = options;
            const offset = (page - 1) * limit;

            return await this.findByCondition(
                { idChat: chatId },
                {
                    include: [{
                        model: User,
                        as: 'emisor',
                        attributes: ['id', 'name', 'first_name', 'last_name', 'email', 'role']
                    }],
                    order: [['created_at', order]],
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            );
        } catch (error) {
            throw new Error(`Error finding messages by chat: ${error.message}`);
        }
    }

    async markMessagesAsRead(chatId, userId) {
        try {
            const [updatedCount] = await Mensaje.update(
                { 
                    leido: true,
                    fechaLectura: new Date()
                },
                {
                    where: {
                        idChat: chatId,
                        idEmisor: { [Op.ne]: userId },
                        leido: false
                    }
                }
            );
            return updatedCount;
        } catch (error) {
            throw new Error(`Error marking messages as read: ${error.message}`);
        }
    }

    async countUnreadMessages(chatId, userId) {
        try {
            return await this.model.count({
                where: {
                    idChat: chatId,
                    idEmisor: { [Op.ne]: userId },
                    leido: false
                }
            });
        } catch (error) {
            throw new Error(`Error counting unread messages: ${error.message}`);
        }
    }

    async findLatestMessageByChat(chatId) {
        try {
            return await this.findOneByCondition(
                { idChat: chatId },
                {
                    include: [{
                        model: User,
                        as: 'emisor',
                        attributes: ['id', 'name', 'first_name', 'last_name', 'role']
                    }],
                    order: [['created_at', 'DESC']]
                }
            );
        } catch (error) {
            throw new Error(`Error finding latest message: ${error.message}`);
        }
    }

    async deleteMessagesByChat(chatId) {
        try {
            return await this.model.destroy({
                where: { idChat: chatId }
            });
        } catch (error) {
            throw new Error(`Error deleting messages by chat: ${error.message}`);
        }
    }

    async findMessageWithChat(messageId) {
        try {
            return await this.findById(messageId, {
                include: [
                    {
                        model: User,
                        as: 'emisor',
                        attributes: ['id', 'name', 'first_name', 'last_name', 'role']
                    },
                    {
                        model: Chat,
                        as: 'chat',
                        attributes: ['id', 'idPsicologo', 'idPaciente']
                    }
                ]
            });
        } catch (error) {
            throw new Error(`Error finding message with chat: ${error.message}`);
        }
    }
}

export default MensajeRepository;
