import { PagoRepository } from '../repositories/PagoRepository.js';
import { SesionRepository } from '../repositories/SesionRepository.js';
import { PacienteRepository } from '../repositories/PacienteRepository.js';
import { PagoDTO, CreatePagoDTO, ComprobanteDTO } from '../dto/PagoDTO.js';
import { ChatService } from './ChatService.js';

export class PagoService {
  constructor() {
    this.pagoRepository = new PagoRepository();
    this.sesionRepository = new SesionRepository();
    this.pacienteRepository = new PacienteRepository();
    this.chatService = new ChatService();
  }

  /**
   * Procesa un nuevo pago
   */
  async procesarPago(pagoData) {
    try {
      // Validar que la sesión existe
      const sesion = await this.sesionRepository.findById(pagoData.idSesion);
      if (!sesion) {
        throw new Error('La sesión especificada no existe');
      }

      // Validar que el paciente existe
      const paciente = await this.pacienteRepository.findById(pagoData.idPaciente);
      if (!paciente) {
        throw new Error('El paciente especificado no existe');
      }

      // Verificar que no existe ya un pago completado para esta sesión
      const pagosExistentes = await this.pagoRepository.findBySesionId(pagoData.idSesion);
      const pagoCompletado = pagosExistentes.find(p => p.estado === 'completado');
      
      if (pagoCompletado) {
        throw new Error('Ya existe un pago completado para esta sesión');
      }

      // Crear DTO para validación
      const createPagoDTO = new CreatePagoDTO(pagoData);

      // Procesar el pago según el método
      let estadoInicial = 'pendiente';
      let detallesPago = {};
      let transactionId = null;

      switch (createPagoDTO.metodoPago) {
        case 'tarjeta':
          // Aquí se integraría con Stripe u otro procesador
          detallesPago = await this.procesarPagoTarjeta(pagoData.detallesTarjeta);
          estadoInicial = detallesPago.estado;
          transactionId = detallesPago.transactionId;
          break;
          
        case 'paypal':
          // Aquí se integraría con PayPal
          detallesPago = await this.procesarPagoPayPal(pagoData.detallesPayPal);
          estadoInicial = detallesPago.estado;
          transactionId = detallesPago.transactionId;
          break;
          
        case 'efectivo':
          // Pago en efectivo se marca como pendiente hasta confirmación
          estadoInicial = 'pendiente';
          detallesPago = { 
            tipo: 'efectivo',
            descripcion: 'Pago en efectivo en consultorio'
          };
          break;
          
        case 'transferencia':
          // Transferencia bancaria se marca como pendiente hasta confirmación
          estadoInicial = 'pendiente';
          detallesPago = {
            tipo: 'transferencia',
            descripcion: 'Transferencia bancaria'
          };
          break;
          
        default:
          throw new Error('Método de pago no válido');
      }

      // Crear el pago con la fecha de pago si ya está completado
      const fechaPago = estadoInicial === 'completado' ? new Date() : null;

      // Crear el pago
      const nuevoPago = await this.pagoRepository.create({
        ...createPagoDTO,
        estado: estadoInicial,
        detallesPago,
        transactionId,
        fechaPago
      });

      // Obtener el pago completo con relaciones
      const pagoCompleto = await this.pagoRepository.findByIdWithRelations(nuevoPago.id);
      
      // Crear o encontrar el chat automáticamente después del pago exitoso
      try {
        // Solo crear el chat si el pago fue exitoso y hay sesión asociada
        if ((estadoInicial === 'completado' || estadoInicial === 'pendiente') && sesion) {
          console.log(`Creando chat automático entre psicólogo ${sesion.idPsicologo} y paciente ${pagoData.idPaciente}`);
          
          // 1. PRIMERO: Asignar el paciente al psicólogo si no está ya asignado
          const pacienteCompleto = await this.pacienteRepository.findById(pagoData.idPaciente);
          if (!pacienteCompleto.idPsicologo || pacienteCompleto.idPsicologo !== sesion.idPsicologo) {
            console.log(`Asignando paciente ${pagoData.idPaciente} al psicólogo ${sesion.idPsicologo}`);
            await this.pacienteRepository.update(pagoData.idPaciente, {
              idPsicologo: sesion.idPsicologo
            });
            console.log('Paciente asignado exitosamente al psicólogo');
          }
          
          // 2. SEGUNDO: Crear el chat
          // Crear un usuario ficticio para el chat service
          const systemUser = {
            userId: pagoData.idPaciente,
            role: 'paciente'
          };
          
          const chatResult = await this.chatService.createOrGetChat(
            sesion.idPsicologo, 
            pagoData.idPaciente, 
            systemUser
          );
          
          if (chatResult.success) {
            console.log('Chat creado/encontrado exitosamente:', chatResult.data.id);
          } else {
            console.warn('No se pudo crear el chat automáticamente:', chatResult.message);
          }
        }
      } catch (chatError) {
        // No fallar el pago si hay error en la creación del chat
        console.warn('Error al crear chat automático (no crítico):', chatError.message);
      }
      
      return new PagoDTO(pagoCompleto);
    } catch (error) {
      console.error('Error en PagoService.procesarPago:', error);
      throw error;
    }
  }

  /**
   * Verifica el estado de un pago
   */
  async verificarEstadoPago(pagoId) {
    try {
      const pago = await this.pagoRepository.findByIdWithRelations(pagoId);
      
      if (!pago) {
        throw new Error('Pago no encontrado');
      }

      // Si el pago está en estado "procesando", verificar con el proveedor
      if (pago.estado === 'procesando') {
        await this.verificarConProveedor(pago);
      }

      return new PagoDTO(pago);
    } catch (error) {
      console.error('Error en PagoService.verificarEstadoPago:', error);
      throw error;
    }
  }

  /**
   * Confirma un pago (para pagos en efectivo o transferencia)
   */
  async confirmarPago(pagoId, transactionId = null) {
    try {
      const pago = await this.pagoRepository.findById(pagoId);
      
      if (!pago) {
        throw new Error('Pago no encontrado');
      }

      if (pago.estado === 'completado') {
        throw new Error('El pago ya está completado');
      }

      // Actualizar estado a completado
      await this.pagoRepository.updateEstado(
        pagoId, 
        'completado', 
        transactionId, 
        new Date()
      );

      // Obtener el pago actualizado
      const pagoActualizado = await this.pagoRepository.findByIdWithRelations(pagoId);
      
      return new PagoDTO(pagoActualizado);
    } catch (error) {
      console.error('Error en PagoService.confirmarPago:', error);
      throw error;
    }
  }

  /**
   * Genera comprobante de pago
   */
  async generarComprobante(pagoId) {
    try {
      const pago = await this.pagoRepository.findByIdWithRelations(pagoId);
      
      if (!pago) {
        throw new Error('Pago no encontrado');
      }

      if (pago.estado !== 'completado') {
        throw new Error('Solo se pueden generar comprobantes para pagos completados');
      }

      return new ComprobanteDTO(pago);
    } catch (error) {
      console.error('Error en PagoService.generarComprobante:', error);
      throw error;
    }
  }

  /**
   * Obtiene el comprobante por número
   */
  async obtenerComprobantePorNumero(numeroComprobante) {
    try {
      const pago = await this.pagoRepository.findByComprobanteNumber(numeroComprobante);
      
      if (!pago) {
        throw new Error('Comprobante no encontrado');
      }

      return new ComprobanteDTO(pago);
    } catch (error) {
      console.error('Error en PagoService.obtenerComprobantePorNumero:', error);
      throw error;
    }
  }

  /**
   * Obtiene pagos de un paciente
   */
  async obtenerPagosPorPaciente(pacienteId) {
    try {
      const pagos = await this.pagoRepository.findByPacienteId(pacienteId);
      return pagos.map(pago => new PagoDTO(pago));
    } catch (error) {
      console.error('Error en PagoService.obtenerPagosPorPaciente:', error);
      throw error;
    }
  }

  /**
   * Obtiene pagos de una sesión
   */
  async obtenerPagosPorSesion(sesionId) {
    try {
      const pagos = await this.pagoRepository.findBySesionId(sesionId);
      return pagos.map(pago => new PagoDTO(pago));
    } catch (error) {
      console.error('Error en PagoService.obtenerPagosPorSesion:', error);
      throw error;
    }
  }

  /**
   * Procesa un pago y crea la sesión asociada en una transacción
   */
  async procesarPagoConSesion(data) {
    const transaction = await this.pagoRepository.model.sequelize.transaction();
    
    try {
      // Validar que el psicólogo existe
      const psicologo = await this.pagoRepository.model.sequelize.models.Psicologo.findByPk(data.idPsicologo, { transaction });
      if (!psicologo) {
        throw new Error('El psicólogo especificado no existe');
      }

      // Validar que el paciente existe
      const paciente = await this.pacienteRepository.findById(data.idPaciente);
      if (!paciente) {
        throw new Error('El paciente especificado no existe');
      }

      // Primero crear la sesión
      const sesionData = {
        idPsicologo: data.idPsicologo,
        idPaciente: data.idPaciente,
        fecha: data.fecha,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        estado: data.estado || "programada"
      };

      const sesion = await this.pagoRepository.model.sequelize.models.Sesion.create(sesionData, { transaction });

      // Luego procesar el pago
      const createPagoDTO = new CreatePagoDTO({
        idSesion: sesion.id,
        idPaciente: data.idPaciente,
        monto: data.monto,
        montoImpuestos: data.montoImpuestos || 0,
        montoTotal: data.montoTotal,
        metodoPago: data.metodoPago,
        descripcion: data.descripcion,
        detallesTarjeta: data.detallesTarjeta,
        detallesPayPal: data.detallesPayPal
      });

      // Procesar el pago según el método
      let estadoInicial = 'pendiente';
      let detallesPago = {};
      let transactionId = null;

      switch (createPagoDTO.metodoPago) {
        case 'tarjeta':
          detallesPago = await this.procesarPagoTarjeta(data.detallesTarjeta);
          estadoInicial = detallesPago.estado;
          transactionId = detallesPago.transactionId;
          break;
          
        case 'paypal':
          detallesPago = await this.procesarPagoPayPal(data.detallesPayPal);
          estadoInicial = detallesPago.estado;
          transactionId = detallesPago.transactionId;
          break;
          
        case 'efectivo':
          estadoInicial = 'pendiente';
          detallesPago = { 
            tipo: 'efectivo',
            descripcion: 'Pago en efectivo en consultorio'
          };
          break;
          
        case 'transferencia':
          estadoInicial = 'pendiente';
          detallesPago = {
            tipo: 'transferencia',
            descripcion: 'Transferencia bancaria'
          };
          break;
          
        default:
          throw new Error('Método de pago no válido');
      }

      // Crear el pago
      const fechaPago = estadoInicial === 'completado' ? new Date() : null;
      const numeroComprobante = await this.pagoRepository.generateComprobanteNumber();

      const nuevoPago = await this.pagoRepository.model.create({
        ...createPagoDTO,
        estado: estadoInicial,
        detallesPago,
        transactionId,
        fechaPago,
        numeroComprobante
      }, { transaction });

      // Confirmar la transacción
      await transaction.commit();

      // Obtener los datos completos después del commit
      const pagoCompleto = await this.pagoRepository.findByIdWithRelations(nuevoPago.id);
      const sesionCompleta = await this.sesionRepository.findById(sesion.id);
      
      // Crear o encontrar el chat automáticamente después del pago exitoso
      try {
        // Solo crear el chat si el pago fue exitoso (completado o pendiente)
        if (estadoInicial === 'completado' || estadoInicial === 'pendiente') {
          console.log(`Creando chat automático entre psicólogo ${data.idPsicologo} y paciente ${data.idPaciente}`);
          
          // 1. PRIMERO: Asignar el paciente al psicólogo si no está ya asignado
          const pacienteCompleto = await this.pacienteRepository.findById(data.idPaciente);
          if (!pacienteCompleto.idPsicologo || pacienteCompleto.idPsicologo !== data.idPsicologo) {
            console.log(`Asignando paciente ${data.idPaciente} al psicólogo ${data.idPsicologo}`);
            await this.pacienteRepository.update(data.idPaciente, {
              idPsicologo: data.idPsicologo
            });
            console.log('Paciente asignado exitosamente al psicólogo');
          }
          
          // 2. SEGUNDO: Crear el chat
          // Crear un usuario ficticio para el chat service (necesario para autorización)
          const systemUser = {
            userId: data.idPaciente,
            role: 'paciente'
          };
          
          const chatResult = await this.chatService.createOrGetChat(
            data.idPsicologo, 
            data.idPaciente, 
            systemUser
          );
          
          if (chatResult.success) {
            console.log('Chat creado/encontrado exitosamente:', chatResult.data.id);
          } else {
            console.warn('No se pudo crear el chat automáticamente:', chatResult.message);
          }
        }
      } catch (chatError) {
        // No fallar el pago si hay error en la creación del chat
        console.warn('Error al crear chat automático (no crítico):', chatError.message);
      }
      
      return {
        pago: new PagoDTO(pagoCompleto),
        sesion: sesionCompleta,
        transactionComplete: true
      };
    } catch (error) {
      // Solo hacer rollback si la transacción aún está activa
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error('Error en PagoService.procesarPagoConSesion:', error);
      throw error;
    }
  }

  // Métodos privados para procesamiento de pagos

  /**
   * Procesa pago con tarjeta (integración futura con Stripe)
   */
  async procesarPagoTarjeta(detallesTarjeta) {
    // TODO: Integrar con Stripe o procesador de tarjetas
    // Por ahora, simular procesamiento exitoso inmediato para desarrollo
    
    return {
      tipo: 'tarjeta',
      procesador: 'stripe',
      estado: 'completado',
      transactionId: `txn_dev_${Date.now()}`,
      mensaje: 'Pago procesado exitosamente'
    };
  }

  /**
   * Procesa pago con PayPal (integración futura)
   */
  async procesarPagoPayPal(detallesPayPal) {
    // TODO: Integrar con PayPal API
    // Por ahora, simular procesamiento exitoso inmediato para desarrollo
    
    return {
      tipo: 'paypal',
      procesador: 'paypal',
      estado: 'completado',
      transactionId: `paypal_dev_${Date.now()}`,
      mensaje: 'Pago procesado exitosamente'
    };
  }

  /**
   * Verifica estado con el proveedor de pago
   */
  async verificarConProveedor(pago) {
    // TODO: Implementar verificación con proveedores reales
    // Por ahora, simular verificación exitosa después de un tiempo
    
    const tiempoTranscurrido = Date.now() - new Date(pago.created_at).getTime();
    
    // Simular que después de 1 minuto el pago se completa automáticamente
    if (tiempoTranscurrido > 60000) {
      await this.pagoRepository.updateEstado(
        pago.id, 
        'completado', 
        `txn_${Date.now()}`, 
        new Date()
      );
    }
  }
}
