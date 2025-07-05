import { SesionRepository } from "../repositories/SesionRepository.js";
import { PsicologoRepository } from "../repositories/PsicologoRepository.js";
import { PacienteRepository } from "../repositories/PacienteRepository.js";
import { NotificacionRepository } from "../repositories/NotificacionRepository.js";
import { ChatRepository } from "../repositories/ChatRepository.js";
import {
  CreateSesionDTO,
  UpdateSesionDTO,
  SesionResponseDTO,
} from "../dto/SesionDTO.js";
import { CreateChatDTO } from "../dto/ChatDTO.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../utils/responseUtils.js";
import { validateUUID } from "../utils/validationUtils.js";

/**
 * Sesion Service
 * Aplica Service Pattern y Single Responsibility Principle
 * Contiene toda la lógica de negocio relacionada con sesiones
 */
export class SesionService {
  constructor() {
    this.sesionRepository = new SesionRepository();
    this.psicologoRepository = new PsicologoRepository();
    this.pacienteRepository = new PacienteRepository();
    this.notificacionRepository = new NotificacionRepository();
    this.chatRepository = new ChatRepository();
  }

  async getAllSesiones(filters = {}, user) {
    try {
      const userId = user.userId || user.id;
      const adjustedFilters = { ...filters };

      // Apply role-based filtering
      if (user.role !== "admin") {
        if (user.role === "psicologo") {
          adjustedFilters.idPsicologo = userId;
        } else if (user.role === "paciente") {
          adjustedFilters.idPaciente = userId;
        } else {
          // Fallback: check if user exists as psychologist, otherwise assume patient
          const psicologo = await this.psicologoRepository.findById(userId);
          if (psicologo) {
            adjustedFilters.idPsicologo = userId;
          } else {
            adjustedFilters.idPaciente = userId;
          }
        }
      }

      const sesiones = await this.sesionRepository.findWithFilters(
        adjustedFilters
      );
      const sesionesDTO = sesiones.map(
        (sesion) => new SesionResponseDTO(sesion)
      );
      return createSuccessResponse(sesionesDTO);
    } catch (error) {
      console.error("Error in SesionService.getAllSesiones:", error);
      return createErrorResponse("Error getting all sessions", 500);
    }
  }

  async getSesionById(id, user) {
    try {
      if (!validateUUID(id)) {
        return createErrorResponse("Invalid session ID format", 400);
      }

      const sesion = await this.sesionRepository.findById(id);
      if (!sesion) {
        return createErrorResponse("Session not found", 404);
      }

      // Check authorization
      if (
        user.role !== "admin" &&
        user.userId !== sesion.idPsicologo &&
        user.userId !== sesion.idPaciente
      ) {
        return createErrorResponse(
          "You are not authorized to view this session",
          403
        );
      }

      return createSuccessResponse(new SesionResponseDTO(sesion));
    } catch (error) {
      console.error("Error in SesionService.getSesionById:", error);
      return createErrorResponse("Error getting session by ID", 500);
    }
  }

  async createSesion(sesionData, user) {
    try {
      const { idPsicologo, idPaciente } = sesionData;

      // Validate psychologist exists
      const psicologo = await this.psicologoRepository.findById(idPsicologo);
      if (!psicologo) {
        return createErrorResponse("Psychologist not found", 404);
      }

      // Validate patient exists
      const paciente = await this.pacienteRepository.findById(idPaciente);
      if (!paciente) {
        return createErrorResponse("Patient not found", 404);
      }

      // Check authorization
      if (
        user.role !== "admin" &&
        user.userId !== idPsicologo &&
        user.userId !== idPaciente
      ) {
        return createErrorResponse(
          "You are not authorized to create this session",
          403
        );
      }

      const sesion = await this.sesionRepository.create(sesionData);

      // ===== NUEVA FUNCIONALIDAD: ASIGNACIÓN AUTOMÁTICA Y CREACIÓN DE CHAT =====

      // 1. Asignar automáticamente el psicólogo al paciente si no está asignado
      console.log("🔄 Verificando asignación psicólogo-paciente...");

      const pacienteCompleto = await this.pacienteRepository.findById(
        idPaciente
      );
      if (!pacienteCompleto.idPsicologo) {
        console.log(
          `📝 Asignando psicólogo ${idPsicologo} al paciente ${idPaciente}`
        );

        await this.pacienteRepository.update(idPaciente, {
          idPsicologo: idPsicologo,
        });

        console.log("✅ Psicólogo asignado exitosamente");
      } else {
        console.log("✅ El paciente ya tiene psicólogo asignado");
      }

      // 2. Crear automáticamente el chat si no existe
      console.log("💬 Verificando existencia de chat...");

      let chat = await this.chatRepository.findChatBetweenUsers(
        idPsicologo,
        idPaciente
      );
      if (!chat) {
        console.log("🔧 Creando chat automáticamente...");

        const psicologoInfo = await this.psicologoRepository.findById(
          idPsicologo,
          { includeUser: true }
        );
        const pacienteInfo = await this.pacienteRepository.findById(
          idPaciente,
          { includeUser: true }
        );

        const chatData = new CreateChatDTO({
          idPsicologo: idPsicologo,
          idPaciente: idPaciente,
          titulo: `Chat con Dr. ${
            psicologoInfo.User?.first_name || "Psicólogo"
          } ${psicologoInfo.User?.last_name || ""}`,
        });

        chat = await this.chatRepository.create(chatData);
        console.log(`✅ Chat creado exitosamente: ${chat.id}`);

        // Crear notificación sobre el nuevo chat
        await this.notificacionRepository.create({
          idUsuario: idPaciente,
          tipo: "chat",
          contenido: `Se ha creado un chat con tu psicólogo Dr. ${
            psicologoInfo.User?.first_name || "Psicólogo"
          }. ¡Ahora pueden comunicarse!`,
          leido: false,
        });

        await this.notificacionRepository.create({
          idUsuario: idPsicologo,
          tipo: "chat",
          contenido: `Se ha creado un chat con tu paciente ${
            pacienteInfo.User?.first_name || "Paciente"
          }. ¡Ahora pueden comunicarse!`,
          leido: false,
        });
      } else {
        console.log("✅ El chat ya existe");
      }

      // ===== FIN DE NUEVA FUNCIONALIDAD =====

      // Create notification for the other party
      const receptorId = user.userId === idPsicologo ? idPaciente : idPsicologo;
      await this.notificacionRepository.create({
        idUsuario: receptorId,
        tipo: "sesion",
        contenido: `Nueva sesión programada para el ${sesionData.fecha} de ${sesionData.horaInicio} a ${sesionData.horaFin}.`,
        leido: false,
      });

      return createSuccessResponse(new SesionResponseDTO(sesion), 201);
    } catch (error) {
      console.error("Error in SesionService.createSesion:", error);
      return createErrorResponse("Error creating session", 500);
    }
  }

  async updateSesion(id, sesionData, user) {
    try {
      if (!validateUUID(id)) {
        return createErrorResponse("Invalid session ID format", 400);
      }

      const sesion = await this.sesionRepository.findById(id);
      if (!sesion) {
        return createErrorResponse("Session not found", 404);
      }

      // Check authorization
      if (
        user.role !== "admin" &&
        user.userId !== sesion.idPsicologo &&
        user.userId !== sesion.idPaciente
      ) {
        return createErrorResponse(
          "You are not authorized to update this session",
          403
        );
      }

      // Check patient permissions
      if (user.userId === sesion.idPaciente && user.role !== "admin") {
        const { estado, fecha, horaInicio, horaFin, notas } = sesionData;
        if (
          (estado && estado !== "cancelada") ||
          fecha ||
          horaInicio ||
          horaFin ||
          notas
        ) {
          return createErrorResponse(
            "As a patient, you can only cancel the session",
            403
          );
        }
      }

      const updatedSesion = await this.sesionRepository.update(id, sesionData);

      // Create notification for the other party
      const receptorId =
        user.userId === sesion.idPsicologo
          ? sesion.idPaciente
          : sesion.idPsicologo;
      let contenido = null;

      if (sesionData.estado === "cancelada") {
        contenido = "Una de tus sesiones ha sido cancelada.";
      } else if (
        sesionData.fecha ||
        sesionData.horaInicio ||
        sesionData.horaFin
      ) {
        contenido = `La sesión ha sido modificada: ${
          sesionData.fecha || sesion.fecha
        }, ${sesionData.horaInicio || sesion.horaInicio} - ${
          sesionData.horaFin || sesion.horaFin
        }.`;
      }

      if (contenido) {
        await this.notificacionRepository.create({
          idUsuario: receptorId,
          tipo: "sesion",
          contenido,
          leido: false,
        });
      }

      return createSuccessResponse(new SesionResponseDTO(updatedSesion));
    } catch (error) {
      console.error("Error in SesionService.updateSesion:", error);
      return createErrorResponse("Error updating session", 500);
    }
  }

  async deleteSesion(id, user) {
    try {
      if (!validateUUID(id)) {
        return createErrorResponse("Invalid session ID format", 400);
      }

      const sesion = await this.sesionRepository.findById(id);
      if (!sesion) {
        return createErrorResponse("Session not found", 404);
      }

      // Check authorization (only admin and psychologist can delete)
      if (user.role !== "admin" && user.userId !== sesion.idPsicologo) {
        return createErrorResponse(
          "You are not authorized to delete this session",
          403
        );
      }

      await this.sesionRepository.delete(id);

      return createSuccessResponse({ message: "Session successfully deleted" });
    } catch (error) {
      console.error("Error in SesionService.deleteSesion:", error);
      return createErrorResponse("Error deleting session", 500);
    }
  }

  async registrarAsistencia(id, data = {}, user) {
    try {
      if (!validateUUID(id)) {
        return createErrorResponse("Invalid session ID format", 400);
      }

      const sesion = await this.sesionRepository.findById(id);
      if (!sesion) {
        return createErrorResponse("Session not found", 404);
      }

      if (user.role !== "admin" && user.userId !== sesion.idPsicologo) {
        return createErrorResponse(
          "You are not authorized to register attendance",
          403
        );
      }

      const sesionActualizada =
        await this.attendanceService.registrarAsistencia(id, data);

      return createSuccessResponse(new SesionResponseDTO(sesionActualizada));
    } catch (error) {
      console.error("Error in SesionService.registrarAsistencia:", error);
      return createErrorResponse("Error registering attendance", 500);
    }
  }
}
