import { ChatRepository } from '../repositories/ChatRepository.js';
import { MensajeRepository } from '../repositories/MensajeRepository.js';
import { PacienteRepository } from '../repositories/PacienteRepository.js';
import { PsicologoRepository } from '../repositories/PsicologoRepository.js';
import { ChatDTO, MensajeDTO, CreateChatDTO, CreateMensajeDTO } from '../dto/ChatDTO.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';
import { validateUUID } from '../utils/validationUtils.js';
import fs from 'fs';
import path from 'path';

/**
 * Chat Service
 * Aplica Service Pattern y Single Responsibility Principle
 * Contiene toda la lógica de negocio relacionada con chats y mensajes
 */
export class ChatService {
    constructor() {
        this.chatRepository = new ChatRepository();
        this.mensajeRepository = new MensajeRepository();
        this.pacienteRepository = new PacienteRepository();
        this.psicologoRepository = new PsicologoRepository();
    }

    // ============ MÉTODOS DE CHAT ============

    async getChatsByUser(userId, userRole) {
        try {
            if (!validateUUID(userId)) {
                return createErrorResponse('Invalid user ID format', 400);
            }

            let chats = [];

            // Filtrar chats según el rol del usuario
            if (userRole === 'psicologo') {
                // Obtener solo pacientes asignados al psicólogo
                const psicologo = await this.psicologoRepository.findById(userId, { includeUser: false });
                if (!psicologo) {
                    return createErrorResponse('Psychologist not found', 404);
                }
                
                // Obtener pacientes asignados
                const pacientesAsignados = await this.pacienteRepository.findByPsicologoId(userId);
                if (!pacientesAsignados || pacientesAsignados.length === 0) {
                    return createSuccessResponse([]);
                }
                
                // Obtener o crear chats solo con los pacientes asignados
                const chatPromises = pacientesAsignados.map(async (paciente) => {
                    // Buscar chat existente o crear uno nuevo
                    let chat = await this.chatRepository.findByPsicologoAndPaciente(userId, paciente.id);
                    if (!chat) {
                        // Si no existe el chat, lo creamos
                        const chatData = new CreateChatDTO({
                            idPsicologo: userId,
                            idPaciente: paciente.id
                        });
                        chat = await this.chatRepository.create(chatData);
                    }
                    return chat;
                });
                
                chats = await Promise.all(chatPromises);
            } else if (userRole === 'paciente') {
                // Obtener solo el chat con el psicólogo asignado
                const paciente = await this.pacienteRepository.findById(userId, { includeUser: false });
                if (!paciente) {
                    return createErrorResponse('Patient not found', 404);
                }
                
                // Si el paciente tiene un psicólogo asignado
                if (paciente.idPsicologo) {
                    // Buscar chat existente o crear uno nuevo
                    let chat = await this.chatRepository.findByPsicologoAndPaciente(paciente.idPsicologo, userId);
                    if (!chat) {
                        // Si no existe el chat, lo creamos
                        const chatData = new CreateChatDTO({
                            idPsicologo: paciente.idPsicologo,
                            idPaciente: userId
                        });
                        chat = await this.chatRepository.create(chatData);
                    }
                    chats = [chat];
                }
            } else {
                // Para admin u otros roles, implementar según necesidad
                chats = await this.chatRepository.findChatsByUserId(userId, userRole);
            }
            
            return createSuccessResponse(ChatDTO.fromArray(chats));
        } catch (error) {
            console.error('Error in ChatService.getChatsByUser:', error);
            return createErrorResponse('Error getting user chats', 500);
        }
    }

    async getChatById(chatId, currentUser) {
        try {
            if (!validateUUID(chatId)) {
                return createErrorResponse('Invalid chat ID format', 400);
            }

            const chat = await this.chatRepository.findChatWithDetails(chatId);
            if (!chat) {
                return createErrorResponse('Chat not found', 404);
            }

            // Verificar autorización
            if (!this.isAuthorizedToAccessChat(currentUser, chat)) {
                return createErrorResponse('Access denied', 403);
            }

            return createSuccessResponse(new ChatDTO(chat));
        } catch (error) {
            console.error('Error in ChatService.getChatById:', error);
            return createErrorResponse('Error getting chat', 500);
        }
    }

    async createOrGetChat(psicologoId, pacienteId, currentUser) {
        try {
            if (!validateUUID(psicologoId) || !validateUUID(pacienteId)) {
                return createErrorResponse('Invalid ID format', 400);
            }

            // Verificar que existen el psicólogo y paciente
            const psicologo = await this.psicologoRepository.findById(psicologoId);
            const paciente = await this.pacienteRepository.findById(pacienteId);

            if (!psicologo) {
                return createErrorResponse('Psychologist not found', 404);
            }
            if (!paciente) {
                return createErrorResponse('Patient not found', 404);
            }

            // Verificar autorización
            if (!this.isAuthorizedToCreateChat(currentUser, psicologoId, pacienteId)) {
                return createErrorResponse('Access denied', 403);
            }

            // Buscar chat existente
            let chat = await this.chatRepository.findChatBetweenUsers(psicologoId, pacienteId);
            
            if (!chat) {
                // Crear nuevo chat
                const chatData = new CreateChatDTO({
                    idPsicologo: psicologoId,
                    idPaciente: pacienteId,
                    titulo: `Chat con ${psicologo.User?.name || 'Psicólogo'} - ${paciente.User?.name || 'Paciente'}`
                });
                
                chat = await this.chatRepository.create(chatData);
                chat = await this.chatRepository.findChatWithDetails(chat.id);
            }

            return createSuccessResponse(new ChatDTO(chat));
        } catch (error) {
            console.error('Error in ChatService.createOrGetChat:', error);
            return createErrorResponse('Error creating or getting chat', 500);
        }
    }

    async updateChatStatus(chatId, estado, currentUser) {
        try {
            if (!validateUUID(chatId)) {
                return createErrorResponse('Invalid chat ID format', 400);
            }

            const chat = await this.chatRepository.findById(chatId);
            if (!chat) {
                return createErrorResponse('Chat not found', 404);
            }

            if (!this.isAuthorizedToModifyChat(currentUser, chat)) {
                return createErrorResponse('Access denied', 403);
            }

            const updatedChat = await this.chatRepository.update(chatId, { estado });
            return createSuccessResponse(new ChatDTO(updatedChat));
        } catch (error) {
            console.error('Error in ChatService.updateChatStatus:', error);
            return createErrorResponse('Error updating chat status', 500);
        }
    }

    // ============ MÉTODOS DE MENSAJES ============

    async getMessagesByChat(chatId, currentUser, options = {}) {
        try {
            if (!validateUUID(chatId)) {
                return createErrorResponse('Invalid chat ID format', 400);
            }

            const chat = await this.chatRepository.findById(chatId);
            if (!chat) {
                return createErrorResponse('Chat not found', 404);
            }

            if (!this.isAuthorizedToAccessChat(currentUser, chat)) {
                return createErrorResponse('Access denied', 403);
            }

            const mensajes = await this.mensajeRepository.findMessagesByChat(chatId, options);
            
            // Marcar mensajes como leídos
            await this.mensajeRepository.markMessagesAsRead(chatId, currentUser.userId);

            return createSuccessResponse(MensajeDTO.fromArray(mensajes));
        } catch (error) {
            console.error('Error in ChatService.getMessagesByChat:', error);
            return createErrorResponse('Error getting messages', 500);
        }
    }

    async sendMessage(messageData, currentUser) {
        try {
            const { idChat, contenido, tipoMensaje = 'texto' } = messageData;

            if (!validateUUID(idChat)) {
                return createErrorResponse('Invalid chat ID format', 400);
            }

            const chat = await this.chatRepository.findById(idChat);
            if (!chat) {
                return createErrorResponse('Chat not found', 404);
            }

            if (!this.isAuthorizedToSendMessage(currentUser, chat)) {
                return createErrorResponse('Access denied', 403);
            }

            // Crear mensaje
            const mensajeDTO = new CreateMensajeDTO({
                ...messageData,
                idEmisor: currentUser.userId,
                tipoMensaje
            });

            const mensaje = await this.mensajeRepository.create(mensajeDTO);
            
            // Actualizar última actividad del chat
            await this.chatRepository.updateUltimaActividad(idChat);

            // Obtener mensaje completo con relaciones
            const mensajeCompleto = await this.mensajeRepository.findMessageWithChat(mensaje.id);
            
            return createSuccessResponse(new MensajeDTO(mensajeCompleto), 201);
        } catch (error) {
            console.error('Error in ChatService.sendMessage:', error);
            return createErrorResponse('Error sending message', 500);
        }
    }

    async sendFileMessage(chatId, fileData, currentUser) {
        try {
            if (!validateUUID(chatId)) {
                return createErrorResponse('Invalid chat ID format', 400);
            }

            const chat = await this.chatRepository.findById(chatId);
            if (!chat) {
                return createErrorResponse('Chat not found', 404);
            }

            if (!this.isAuthorizedToSendMessage(currentUser, chat)) {
                return createErrorResponse('Access denied', 403);
            }

            // Determinar tipo de mensaje basado en el MIME type
            let tipoMensaje = 'archivo';
            if (fileData.mimeType?.startsWith('image/')) {
                tipoMensaje = 'imagen';
            } else if (fileData.mimeType === 'application/pdf') {
                tipoMensaje = 'pdf';
            } else if (fileData.mimeType?.includes('document') || fileData.mimeType?.includes('word')) {
                tipoMensaje = 'documento';
            }

            const mensajeData = {
                idChat: chatId,
                idEmisor: currentUser.userId,
                contenido: `Archivo adjunto: ${fileData.nombreArchivo}`,
                tipoMensaje,
                nombreArchivo: fileData.nombreArchivo,
                rutaArchivo: fileData.rutaArchivo,
                tamanoArchivo: fileData.tamanoArchivo,
                mimeType: fileData.mimeType
            };

            const mensaje = await this.mensajeRepository.create(mensajeData);
            
            // Actualizar última actividad del chat
            await this.chatRepository.updateUltimaActividad(chatId);

            // Obtener mensaje completo con relaciones
            const mensajeCompleto = await this.mensajeRepository.findMessageWithChat(mensaje.id);
            
            return createSuccessResponse(new MensajeDTO(mensajeCompleto), 201);
        } catch (error) {
            console.error('Error in ChatService.sendFileMessage:', error);
            return createErrorResponse('Error sending file message', 500);
        }
    }

    async deleteMessage(messageId, currentUser) {
        try {
            if (!validateUUID(messageId)) {
                return createErrorResponse('Invalid message ID format', 400);
            }

            const mensaje = await this.mensajeRepository.findById(messageId);
            if (!mensaje) {
                return createErrorResponse('Message not found', 404);
            }

            // Solo el emisor puede eliminar su mensaje
            if (mensaje.idEmisor !== currentUser.userId) {
                return createErrorResponse('Access denied', 403);
            }

            // Si hay archivo asociado, eliminarlo del sistema de archivos
            if (mensaje.rutaArchivo) {
                try {
                    const filePath = path.join(process.cwd(), 'public', mensaje.rutaArchivo);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (fileError) {
                    console.warn('Error deleting file:', fileError);
                }
            }

            await this.mensajeRepository.delete(messageId);
            return createSuccessResponse({ message: 'Message deleted successfully' });
        } catch (error) {
            console.error('Error in ChatService.deleteMessage:', error);
            return createErrorResponse('Error deleting message', 500);
        }
    }

    // ============ MÉTODOS DE AUTORIZACIÓN ============

    isAuthorizedToAccessChat(currentUser, chat) {
        if (currentUser.role === 'admin') return true;
        
        return currentUser.userId === chat.idPsicologo || 
               currentUser.userId === chat.idPaciente;
    }

    isAuthorizedToCreateChat(currentUser, psicologoId, pacienteId) {
        if (currentUser.role === 'admin') return true;
        
        return currentUser.userId === psicologoId || 
               currentUser.userId === pacienteId;
    }

    isAuthorizedToModifyChat(currentUser, chat) {
        if (currentUser.role === 'admin') return true;
        
        // Solo psicólogos pueden modificar estado del chat
        return currentUser.role === 'psicologo' && 
               currentUser.userId === chat.idPsicologo;
    }

    isAuthorizedToSendMessage(currentUser, chat) {
        return this.isAuthorizedToAccessChat(currentUser, chat);
    }
}

export default ChatService;
