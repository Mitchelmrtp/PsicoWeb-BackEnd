import { SesionRepository } from "../repositories/SesionRepository.js";
import { PsicologoRepository } from "../repositories/PsicologoRepository.js";
import { PacienteRepository } from "../repositories/PacienteRepository.js";
import { NotificacionRepository } from "../repositories/NotificacionRepository.js";
import { ChatRepository } from "../repositories/ChatRepository.js";
import EmailService from "./EmailService.js";
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

      // Obtener información completa del psicólogo y paciente
      const psicologoInfo = await this.psicologoRepository.findById(
        idPsicologo,
        { includeUser: true }
      );
      const pacienteInfo = await this.pacienteRepository.findById(
        idPaciente,
        { includeUser: true }
      );

      let chat = await this.chatRepository.findChatBetweenUsers(
        idPsicologo,
        idPaciente
      );
      if (!chat) {
        console.log("🔧 Creando chat automáticamente...");

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

      // Preparar información para notificaciones y correos
      const pacienteUser =
        pacienteInfo.User || (await pacienteInfo.getUser?.());
      const psicologoUser =
        psicologoInfo.User || (await psicologoInfo.getUser?.());

      const nombrePaciente = `${pacienteUser?.first_name || ""} ${
        pacienteUser?.last_name || ""
      }`.trim() || "Paciente";
      const nombrePsicologo = `${psicologoUser?.first_name || ""} ${
        psicologoUser?.last_name || ""
      }`.trim() || "Psicólogo";

      const fechaFormateada = new Date(
        `${sesion.fecha}T${sesion.horaInicio}`
      ).toLocaleString("es-PE", {
        dateStyle: "full",
        timeStyle: "short",
      });

      // ===== ENVÍO DE CORREOS AUTOMÁTICOS =====
      console.log(`📧 Enviando notificaciones por correo a ${nombrePaciente} y ${nombrePsicologo}`);
      console.log(`📅 Cita programada para: ${fechaFormateada}`);

      try {
        // Enviar correo al paciente
        if (pacienteUser?.email) {
          const correoPaciente = `Hola ${nombrePaciente},

¡Gracias por reservar tu cita en PsicoApp! 🎉

Te confirmamos que has agendado exitosamente una sesión con el psicólogo ${nombrePsicologo}.

📋 RESUMEN DE TU CITA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍⚕️ Psicólogo: Dr. ${nombrePsicologo}
📅 Fecha y hora: ${fechaFormateada}
💬 Chat disponible: Ya puedes comunicarte con tu psicólogo a través del chat
🏥 Plataforma: PsicoApp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este encuentro representa un paso importante en tu bienestar emocional y personal. Queremos que sepas que estás dando un gran paso al priorizar tu salud mental, y estaremos aquí para acompañarte en todo el proceso.

📌 RECOMENDACIONES IMPORTANTES:
• Conéctate unos minutos antes de la sesión
• Si necesitas reprogramar o cancelar, puedes hacerlo desde tu panel
• Utiliza el chat para cualquier consulta previa con tu psicólogo
• Prepara las preguntas o temas que te gustaría abordar

Ante cualquier duda o inconveniente, no dudes en contactarnos.
Nuestro equipo estará encantado de ayudarte.

¡Gracias por confiar en nosotros! 💙
El equipo de PsicoApp

═══════════════════════════════════════════════════════════════════════════════
Este correo fue generado automáticamente. Por favor, no responder a este mensaje.
═══════════════════════════════════════════════════════════════════════════════`;

          await EmailService.enviarCorreo(
            pacienteUser.email,
            "✅ Cita reservada exitosamente - PsicoApp",
            correoPaciente
          );
          console.log(`✅ Correo enviado exitosamente al paciente: ${pacienteUser.email}`);
        }

        // Enviar correo al psicólogo
        if (psicologoUser?.email) {
          const correoPsicologo = `Hola Dr. ${nombrePsicologo},

Te informamos que un nuevo paciente ha reservado una sesión contigo mediante PsicoApp.

📋 DETALLES DE LA NUEVA CITA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Paciente: ${nombrePaciente}
📅 Fecha y hora: ${fechaFormateada}
💬 Chat disponible: Ya puedes comunicarte con tu paciente
🔗 Acceso: Disponible en tu panel de profesional
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 PRÓXIMOS PASOS:
• Revisa los detalles desde tu panel de profesional
• Puedes usar el chat para establecer comunicación anticipada si lo consideras apropiado
• Prepara los materiales o enfoques que planeas utilizar en la sesión
• Confirma tu disponibilidad para el horario programado

Recuerda que tu profesionalismo y dedicación hacen la diferencia en el bienestar de nuestros usuarios.

¡Gracias por formar parte de PsicoApp! 👨‍⚕️
El bienestar comienza contigo.

Atentamente,
El equipo de PsicoApp

═══════════════════════════════════════════════════════════════════════════════
Este correo fue generado automáticamente. Por favor, no responder a este mensaje.
═══════════════════════════════════════════════════════════════════════════════`;

          await EmailService.enviarCorreo(
            psicologoUser.email,
            "🔔 Nueva cita agendada con un paciente - PsicoApp",
            correoPsicologo
          );
          console.log(`✅ Correo enviado exitosamente al psicólogo: ${psicologoUser.email}`);
        }
      } catch (emailError) {
        console.error("❌ Error enviando correos:", emailError);
        // No fallar la creación de sesión si hay error en los correos
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
