import { BaseRepository } from './BaseRepository.js';
import Calendario from '../models/Calendario.js';
import Notificacion from '../models/Notificacion.js';
import User from '../models/User.js';

export class CalendarioRepository extends BaseRepository {
    constructor() {
        super(Calendario);
    }
    
    async findByUsuarioId(usuarioId) {
        return await Calendario.findAll({
            where: { idUsuario: usuarioId },
            order: [['fechaInicio', 'ASC']]
        });
    }
    
    async findAllWithUsers() {
        return await Calendario.findAll({
            include: [{
                model: User,
                attributes: ['name', 'first_name', 'last_name', 'email']
            }],
            order: [['fechaInicio', 'ASC']]
        });
    }
    
    async findByDateRange(fechaInicio, fechaFin, usuarioId = null) {
        const whereClause = {
            [this.model.sequelize.Op.or]: [
                {
                    fechaInicio: {
                        [this.model.sequelize.Op.between]: [fechaInicio, fechaFin]
                    }
                },
                {
                    fechaFin: {
                        [this.model.sequelize.Op.between]: [fechaInicio, fechaFin]
                    }
                },
                {
                    [this.model.sequelize.Op.and]: [
                        { fechaInicio: { [this.model.sequelize.Op.lte]: fechaInicio } },
                        { fechaFin: { [this.model.sequelize.Op.gte]: fechaFin } }
                    ]
                }
            ]
        };
        
        if (usuarioId) {
            whereClause.idUsuario = usuarioId;
        }
        
        return await Calendario.findAll({
            where: whereClause,
            include: [{
                model: User,
                attributes: ['name', 'first_name', 'last_name']
            }],
            order: [['fechaInicio', 'ASC']]
        });
    }
}

export class NotificacionRepository extends BaseRepository {
    constructor() {
        super(Notificacion);
    }
    
    async findByUsuarioId(usuarioId) {
        return await Notificacion.findAll({
            where: { idUsuario: usuarioId },
            order: [['fechaCreacion', 'DESC']]
        });
    }
    
    async findNoLeidasByUsuarioId(usuarioId) {
        return await Notificacion.findAll({
            where: { 
                idUsuario: usuarioId,
                leida: false
            },
            order: [['fechaCreacion', 'DESC']]
        });
    }
    
    async markAsRead(id, usuarioId) {
        return await Notificacion.update(
            { leida: true },
            { 
                where: { 
                    id: id,
                    idUsuario: usuarioId
                } 
            }
        );
    }
    
    async markAllAsRead(usuarioId) {
        return await Notificacion.update(
            { leida: true },
            { 
                where: { 
                    idUsuario: usuarioId,
                    leida: false
                } 
            }
        );
    }
    
    async countNoLeidas(usuarioId) {
        return await Notificacion.count({
            where: { 
                idUsuario: usuarioId,
                leida: false
            }
        });
    }
}
