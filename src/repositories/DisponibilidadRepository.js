import { BaseRepository } from './BaseRepository.js';
import DisponibilidadPsicologo from '../models/DisponibilidadPsicologo.js';
import Psicologo from '../models/Psicologo.js';
import User from '../models/User.js';

export class DisponibilidadRepository extends BaseRepository {
    constructor() {
        super(DisponibilidadPsicologo);
    }
    
    async findByPsicologoId(psicologoId) {
        return await DisponibilidadPsicologo.findAll({
            where: { idPsicologo: psicologoId },
            order: [['diaSemana', 'ASC'], ['horaInicio', 'ASC']]
        });
    }
    
    async findActivasByPsicologoId(psicologoId) {
        return await DisponibilidadPsicologo.findAll({
            where: { 
                idPsicologo: psicologoId,
                activa: true
            },
            order: [['diaSemana', 'ASC'], ['horaInicio', 'ASC']]
        });
    }
    
    async findAllWithPsicologos() {
        return await DisponibilidadPsicologo.findAll({
            include: [{
                model: Psicologo,
                include: [{
                    model: User,
                    attributes: ['name', 'first_name', 'last_name']
                }]
            }],
            order: [['diaSemana', 'ASC'], ['horaInicio', 'ASC']]
        });
    }
    
    async findConflictingSchedule(psicologoId, diaSemana, horaInicio, horaFin, excludeId = null) {
        const whereClause = {
            idPsicologo: psicologoId,
            diaSemana: diaSemana,
            activa: true,
            [this.model.sequelize.Op.or]: [
                {
                    horaInicio: {
                        [this.model.sequelize.Op.between]: [horaInicio, horaFin]
                    }
                },
                {
                    horaFin: {
                        [this.model.sequelize.Op.between]: [horaInicio, horaFin]
                    }
                },
                {
                    [this.model.sequelize.Op.and]: [
                        { horaInicio: { [this.model.sequelize.Op.lte]: horaInicio } },
                        { horaFin: { [this.model.sequelize.Op.gte]: horaFin } }
                    ]
                }
            ]
        };
        
        if (excludeId) {
            whereClause.id = { [this.model.sequelize.Op.ne]: excludeId };
        }
        
        return await DisponibilidadPsicologo.findAll({
            where: whereClause
        });
    }
}
