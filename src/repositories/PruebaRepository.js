import { BaseRepository } from './BaseRepository.js';
import Prueba from '../models/Prueba.js';
import Pregunta from '../models/Pregunta.js';
import ResultadoPrueba from '../models/ResultadoPrueba.js';
import Paciente from '../models/Paciente.js';
import User from '../models/User.js';

export class PruebaRepository extends BaseRepository {
    constructor() {
        super(Prueba);
    }
    
    async findAllWithPreguntas() {
        return await Prueba.findAll({
            include: [{
                model: Pregunta,
                as: 'Preguntas'
            }]
        });
    }
    
    async findByIdWithPreguntas(id) {
        return await Prueba.findByPk(id, {
            include: [{
                model: Pregunta,
                as: 'Preguntas'
            }]
        });
    }
}

export class PreguntaRepository extends BaseRepository {
    constructor() {
        super(Pregunta);
    }
    
    async findByPruebaId(pruebaId) {
        return await Pregunta.findAll({
            where: { idPrueba: pruebaId }
        });
    }
    
    async deleteByPruebaId(pruebaId) {
        return await Pregunta.destroy({
            where: { idPrueba: pruebaId }
        });
    }
}

export class ResultadoPruebaRepository extends BaseRepository {
    constructor() {
        super(ResultadoPrueba);
    }
    
    async findByPacienteId(pacienteId) {
        return await ResultadoPrueba.findAll({
            where: { idPaciente: pacienteId },
            include: [{
                model: Prueba,
                as: 'Prueba',
                attributes: ['id', 'titulo', 'descripcion']
            }],
            order: [['fechaRealizacion', 'DESC']]
        });
    }
    
    async findByPruebaId(pruebaId) {
        return await ResultadoPrueba.findAll({
            where: { idPrueba: pruebaId },
            include: [{
                model: Paciente,
                include: [{
                    model: User,
                    attributes: ['name', 'first_name', 'last_name']
                }]
            }],
            order: [['createdAt', 'DESC']]
        });
    }
    
    async findByPacienteAndPrueba(pacienteId, pruebaId) {
        return await ResultadoPrueba.findOne({
            where: { 
                idPaciente: pacienteId,
                idPrueba: pruebaId
            }
        });
    }
}
