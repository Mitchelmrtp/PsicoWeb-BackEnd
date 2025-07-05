import { BaseRepository } from './BaseRepository.js';
import Pago from '../models/Pago.js';
import Sesion from '../models/Sesion.js';
import Paciente from '../models/Paciente.js';
import User from '../models/User.js';

export class PagoRepository extends BaseRepository {
  constructor() {
    super(Pago);
  }

  /**
   * Crea un nuevo pago con número de comprobante único
   */
  async create(pagoData) {
    // Generar número de comprobante único
    const numeroComprobante = await this.generateComprobanteNumber();
    
    return await this.model.create({
      ...pagoData,
      numeroComprobante
    });
  }

  /**
   * Busca un pago por ID con relaciones
   */
  async findByIdWithRelations(id) {
    return await this.model.findByPk(id, {
      include: [
        {
          model: Sesion,
          as: 'sesion'
        },
        {
          model: Paciente,
          as: 'paciente',
          include: [
            {
              model: User,
              as: 'User',
              attributes: ['id', 'name', 'first_name', 'last_name', 'email']
            }
          ]
        }
      ]
    });
  }

  /**
   * Busca pagos por ID de sesión
   */
  async findBySesionId(sesionId) {
    return await this.model.findAll({
      where: { idSesion: sesionId },
      include: [
        {
          model: Sesion,
          as: 'sesion'
        },
        {
          model: Paciente,
          as: 'paciente',
          include: [
            {
              model: User,
              as: 'User',
              attributes: ['id', 'name', 'first_name', 'last_name', 'email']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * Busca pagos por ID de paciente
   */
  async findByPacienteId(pacienteId) {
    return await this.model.findAll({
      where: { idPaciente: pacienteId },
      include: [
        {
          model: Sesion,
          as: 'sesion'
        },
        {
          model: Paciente,
          as: 'paciente',
          include: [
            {
              model: User,
              as: 'User',
              attributes: ['id', 'name', 'first_name', 'last_name', 'email']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * Busca un pago por número de comprobante
   */
  async findByComprobanteNumber(numeroComprobante) {
    return await this.model.findOne({
      where: { numeroComprobante },
      include: [
        {
          model: Sesion,
          as: 'sesion'
        },
        {
          model: Paciente,
          as: 'paciente',
          include: [
            {
              model: User,
              as: 'User',
              attributes: ['id', 'name', 'first_name', 'last_name', 'email']
            }
          ]
        }
      ]
    });
  }

  /**
   * Actualiza el estado de un pago
   */
  async updateEstado(id, estado, transactionId = null, fechaPago = null) {
    const updateData = { estado };
    
    if (transactionId) {
      updateData.transactionId = transactionId;
    }
    
    if (fechaPago) {
      updateData.fechaPago = fechaPago;
    } else if (estado === 'completado') {
      updateData.fechaPago = new Date();
    }

    return await this.model.update(updateData, {
      where: { id },
      returning: true
    });
  }

  /**
   * Busca pagos por estado
   */
  async findByEstado(estado) {
    return await this.model.findAll({
      where: { estado },
      include: [
        {
          model: Sesion,
          as: 'sesion'
        },
        {
          model: Paciente,
          as: 'paciente',
          include: [
            {
              model: User,
              as: 'User',
              attributes: ['id', 'name', 'first_name', 'last_name', 'email']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * Genera un número único de comprobante
   */
  async generateComprobanteNumber() {
    const prefix = 'COMP';
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    let numeroComprobante = `${prefix}-${timestamp}-${random}`;
    
    // Verificar que sea único
    let exists = await this.model.findOne({ where: { numeroComprobante } });
    let counter = 1;
    
    while (exists) {
      numeroComprobante = `${prefix}-${timestamp}-${random}-${counter}`;
      exists = await this.model.findOne({ where: { numeroComprobante } });
      counter++;
    }
    
    return numeroComprobante;
  }
}
