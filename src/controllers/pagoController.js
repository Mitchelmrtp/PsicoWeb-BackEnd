import { PagoService } from '../services/PagoService.js';

class PagoController {
  constructor() {
    this.pagoService = new PagoService();
  }

  /**
   * Procesa un nuevo pago
   * POST /api/pagos
   */
  procesarPago = async (req, res) => {
    try {
      const { 
        idSesion, 
        monto, 
        montoImpuestos, 
        montoTotal, 
        metodoPago, 
        descripcion,
        detallesTarjeta,
        detallesPayPal 
      } = req.body;

      // Validaciones básicas
      if (!idSesion || !monto || !montoTotal || !metodoPago) {
        return res.status(400).json({
          success: false,
          message: 'Campos requeridos: idSesion, monto, montoTotal, metodoPago'
        });
      }

      // Obtener ID del paciente del usuario autenticado
      // El ID del paciente es el mismo que el userId para usuarios con rol 'paciente'
      const idPaciente = req.user.userId || req.user.id;
      if (!idPaciente || req.user.role !== 'paciente') {
        return res.status(403).json({
          success: false,
          message: 'Solo los pacientes pueden procesar pagos'
        });
      }

      const pagoData = {
        idSesion,
        idPaciente,
        monto,
        montoImpuestos: montoImpuestos || 0,
        montoTotal,
        metodoPago,
        descripcion,
        detallesTarjeta,
        detallesPayPal
      };

      const pago = await this.pagoService.procesarPago(pagoData);

      res.status(201).json({
        success: true,
        message: 'Pago procesado exitosamente',
        data: pago
      });
    } catch (error) {
      console.error('Error in PagoController.procesarPago:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al procesar el pago'
      });
    }
  };

  /**
   * Verifica el estado de un pago
   * GET /api/pagos/:id/estado
   */
  verificarEstado = async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID del pago es requerido'
        });
      }

      const pago = await this.pagoService.verificarEstadoPago(id);

      res.json({
        success: true,
        data: {
          id: pago.id,
          estado: pago.estado,
          fechaPago: pago.fechaPago,
          transactionId: pago.transactionId
        }
      });
    } catch (error) {
      console.error('Error in PagoController.verificarEstado:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Error al verificar el estado del pago'
      });
    }
  };

  /**
   * Confirma un pago (para administradores/psicólogos)
   * PATCH /api/pagos/:id/confirmar
   */
  confirmarPago = async (req, res) => {
    try {
      const { id } = req.params;
      const { transactionId } = req.body;

      // Solo psicólogos y administradores pueden confirmar pagos
      if (req.user.role !== 'psicologo' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para confirmar pagos'
        });
      }

      const pago = await this.pagoService.confirmarPago(id, transactionId);

      res.json({
        success: true,
        message: 'Pago confirmado exitosamente',
        data: pago
      });
    } catch (error) {
      console.error('Error in PagoController.confirmarPago:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al confirmar el pago'
      });
    }
  };

  /**
   * Genera comprobante de pago
   * GET /api/pagos/:id/comprobante
   */
  generarComprobante = async (req, res) => {
    try {
      const { id } = req.params;

      const comprobante = await this.pagoService.generarComprobante(id);

      res.json({
        success: true,
        data: comprobante
      });
    } catch (error) {
      console.error('Error in PagoController.generarComprobante:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Error al generar el comprobante'
      });
    }
  };

  /**
   * Obtiene comprobante por número
   * GET /api/pagos/comprobante/:numero
   */
  obtenerComprobante = async (req, res) => {
    try {
      const { numero } = req.params;

      const comprobante = await this.pagoService.obtenerComprobantePorNumero(numero);

      res.json({
        success: true,
        data: comprobante
      });
    } catch (error) {
      console.error('Error in PagoController.obtenerComprobante:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Comprobante no encontrado'
      });
    }
  };

  /**
   * Obtiene pagos del paciente actual
   * GET /api/pagos/mis-pagos
   */
  misPagos = async (req, res) => {
    try {
      const idPaciente = req.user.paciente?.id;
      
      if (!idPaciente) {
        return res.status(403).json({
          success: false,
          message: 'Solo los pacientes pueden acceder a sus pagos'
        });
      }

      const pagos = await this.pagoService.obtenerPagosPorPaciente(idPaciente);

      res.json({
        success: true,
        data: pagos
      });
    } catch (error) {
      console.error('Error in PagoController.misPagos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los pagos'
      });
    }
  };

  /**
   * Obtiene pagos de una sesión específica
   * GET /api/pagos/sesion/:sesionId
   */
  pagosPorSesion = async (req, res) => {
    try {
      const { sesionId } = req.params;

      // Los psicólogos pueden ver pagos de cualquier sesión
      // Los pacientes solo pueden ver pagos de sus propias sesiones
      if (req.user.role === 'paciente') {
        // TODO: Verificar que la sesión pertenece al paciente
      }

      const pagos = await this.pagoService.obtenerPagosPorSesion(sesionId);

      res.json({
        success: true,
        data: pagos
      });
    } catch (error) {
      console.error('Error in PagoController.pagosPorSesion:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los pagos de la sesión'
      });
    }
  };

  /**
   * Obtiene todos los pagos (solo para psicólogos/admin)
   * GET /api/pagos
   */
  findAll = async (req, res) => {
    try {
      // Solo psicólogos y administradores pueden ver todos los pagos
      if (req.user.role !== 'psicologo' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver todos los pagos'
        });
      }

      const { estado, pacienteId } = req.query;
      let pagos;

      if (estado) {
        // Filtrar por estado - esto requeriría un método adicional en el service
        pagos = await this.pagoService.obtenerPagosPorEstado(estado);
      } else if (pacienteId) {
        pagos = await this.pagoService.obtenerPagosPorPaciente(pacienteId);
      } else {
        // Por ahora, devolver array vacío - se implementaría un método findAll en el service
        pagos = [];
      }

      res.json({
        success: true,
        data: pagos
      });
    } catch (error) {
      console.error('Error in PagoController.findAll:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los pagos'
      });
    }
  };

  /**
   * Procesa un pago y crea la sesión asociada en una transacción
   * POST /api/pagos/procesar-con-sesion
   */
  procesarPagoConSesion = async (req, res) => {
    try {
      const { 
        // Datos del pago
        monto, 
        montoImpuestos, 
        montoTotal, 
        metodoPago, 
        descripcion,
        detallesTarjeta,
        detallesPayPal,
        // Datos de la sesión
        idPsicologo,
        fecha,
        horaInicio,
        horaFin
      } = req.body;

      // Validaciones básicas para pago
      if (!monto || !montoTotal || !metodoPago) {
        return res.status(400).json({
          success: false,
          message: 'Campos requeridos del pago: monto, montoTotal, metodoPago'
        });
      }

      // Validaciones básicas para sesión
      if (!idPsicologo || !fecha || !horaInicio || !horaFin) {
        return res.status(400).json({
          success: false,
          message: 'Campos requeridos de la sesión: idPsicologo, fecha, horaInicio, horaFin'
        });
      }

      // Obtener ID del paciente del usuario autenticado
      const idPaciente = req.user.userId || req.user.id;
      if (!idPaciente || req.user.role !== 'paciente') {
        return res.status(403).json({
          success: false,
          message: 'Solo los pacientes pueden procesar pagos'
        });
      }

      // Llamar al servicio para procesar pago y crear sesión
      const resultado = await this.pagoService.procesarPagoConSesion({
        // Datos del pago
        idPaciente,
        monto,
        montoImpuestos: montoImpuestos || 0,
        montoTotal,
        metodoPago,
        descripcion,
        detallesTarjeta,
        detallesPayPal,
        // Datos de la sesión
        idPsicologo,
        fecha,
        horaInicio,
        horaFin,
        estado: "programada"
      });

      res.status(201).json({
        success: true,
        message: 'Pago procesado y sesión creada exitosamente',
        data: resultado
      });
    } catch (error) {
      console.error('Error in PagoController.procesarPagoConSesion:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al procesar el pago y crear la sesión'
      });
    }
  };
}

const pagoController = new PagoController();

export default {
  procesarPago: pagoController.procesarPago.bind(pagoController),
  verificarEstado: pagoController.verificarEstado.bind(pagoController),
  confirmarPago: pagoController.confirmarPago.bind(pagoController),
  generarComprobante: pagoController.generarComprobante.bind(pagoController),
  obtenerComprobante: pagoController.obtenerComprobante.bind(pagoController),
  misPagos: pagoController.misPagos.bind(pagoController),
  pagosPorSesion: pagoController.pagosPorSesion.bind(pagoController),
  findAll: pagoController.findAll.bind(pagoController),
  procesarPagoConSesion: pagoController.procesarPagoConSesion.bind(pagoController)
};
