import { BaseRepository } from './BaseRepository.js';
import DisponibilidadPsicologo from '../models/DisponibilidadPsicologo.js';
import Psicologo from '../models/Psicologo.js';
import User from '../models/User.js';
import { Op } from 'sequelize';

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
                activo: true
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
            activo: true,
            [Op.or]: [
                {
                    horaInicio: {
                        [Op.between]: [horaInicio, horaFin]
                    }
                },
                {
                    horaFin: {
                        [Op.between]: [horaInicio, horaFin]
                    }
                },
                {
                    [Op.and]: [
                        { horaInicio: { [Op.lte]: horaInicio } },
                        { horaFin: { [Op.gte]: horaFin } }
                    ]
                }
            ]
        };
        
        if (excludeId) {
            whereClause.id = { [Op.ne]: excludeId };
        }
        
        return await DisponibilidadPsicologo.findAll({
            where: whereClause
        });
    }
}
