import { BaseRepository } from './BaseRepository.js';
import { Chat, Psicologo, Paciente, User, Mensaje } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Chat Repository Implementation
 * Aplica Repository Pattern y Single Responsibility Principle
 * Maneja todas las operaciones de base de datos relacionadas con chats
 */
export class ChatRepository extends BaseRepository {
    constructor() {
        super(Chat);
    }

    async findChatsByUserId(userId, userRole) {
        try {
            const whereCondition = userRole === 'psicologo' 
                ? { idPsicologo: userId }
                : { idPaciente: userId };

            return await this.findByCondition(whereCondition, {
                include: [
                    {
                        model: Psicologo,
                        as: 'psicologo',
                        include: [{
                            model: User,
                            attributes: ['name', 'first_name', 'last_name', 'email']
                        }]
                    },
                    {
                        model: Paciente,
                        as: 'paciente',
                        include: [{
                            model: User,
                            attributes: ['name', 'first_name', 'last_name', 'email']
                        }]
                    },
                    {
                        model: Mensaje,
                        as: 'mensajes',
                        limit: 1,
                        order: [['created_at', 'DESC']],
                        include: [{
                            model: User,
                            as: 'emisor',
                            attributes: ['name', 'first_name', 'last_name', 'role']
                        }]
                    }
                ],
                order: [['ultimaActividad', 'DESC']]
            });
        } catch (error) {
            throw new Error(`Error finding chats by user: ${error.message}`);
        }
    }

    async findChatBetweenUsers(psicologoId, pacienteId) {
        try {
            return await this.findOneByCondition({
                idPsicologo: psicologoId,
                idPaciente: pacienteId
            }, {
                include: [
                    {
                        model: Psicologo,
                        as: 'psicologo',
                        include: [{
                            model: User,
                            attributes: ['name', 'first_name', 'last_name', 'email']
                        }]
                    },
                    {
                        model: Paciente,
                        as: 'paciente',
                        include: [{
                            model: User,
                            attributes: ['name', 'first_name', 'last_name', 'email']
                        }]
                    }
                ]
            });
        } catch (error) {
            throw new Error(`Error finding chat between users: ${error.message}`);
        }
    }

    async findChatWithDetails(chatId) {
        try {
            return await this.findById(chatId, {
                include: [
                    {
                        model: Psicologo,
                        as: 'psicologo',
                        include: [{
                            model: User,
                            attributes: ['name', 'first_name', 'last_name', 'email']
                        }]
                    },
                    {
                        model: Paciente,
                        as: 'paciente',
                        include: [{
                            model: User,
                            attributes: ['name', 'first_name', 'last_name', 'email']
                        }]
                    }
                ]
            });
        } catch (error) {
            throw new Error(`Error finding chat with details: ${error.message}`);
        }
    }

    async updateUltimaActividad(chatId) {
        try {
            return await this.update(chatId, {
                ultimaActividad: new Date()
            });
        } catch (error) {
            throw new Error(`Error updating last activity: ${error.message}`);
        }
    }

    async countUnreadMessagesByChat(chatId, userId) {
        try {
            return await Mensaje.count({
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

    async findByPsicologoAndPaciente(psicologoId, pacienteId) {
        try {
            return await this.findOneByCondition({ 
                idPsicologo: psicologoId,
                idPaciente: pacienteId
            }, {
                include: [
                    {
                        model: Psicologo,
                        as: 'psicologo',
                        include: [{
                            model: User,
                            attributes: ['name', 'first_name', 'last_name', 'email']
                        }]
                    },
                    {
                        model: Paciente,
                        as: 'paciente',
                        include: [{
                            model: User,
                            attributes: ['name', 'first_name', 'last_name', 'email']
                        }]
                    },
                    {
                        model: Mensaje,
                        as: 'mensajes',
                        limit: 1,
                        order: [['created_at', 'DESC']],
                        include: [{
                            model: User,
                            as: 'emisor',
                            attributes: ['name', 'first_name', 'last_name', 'role']
                        }]
                    }
                ]
            });
        } catch (error) {
            throw new Error(`Error finding chat by psychologist and patient: ${error.message}`);
        }
    }
}

export default ChatRepository;
