import { PruebaRepository, PreguntaRepository, ResultadoPruebaRepository } from '../repositories/PruebaRepository.js';
import { PacienteRepository } from '../repositories/PacienteRepository.js';
import { PsicologoRepository } from '../repositories/PsicologoRepository.js';
import { PruebaDTO, PreguntaDTO, ResultadoPruebaDTO } from '../dto/PruebaDTO.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';
import { validateUUID } from '../utils/validationUtils.js';
import { sequelize } from '../models/index.js';

export class PruebaService {
    constructor() {
        this.pruebaRepository = new PruebaRepository();
        this.preguntaRepository = new PreguntaRepository();
        this.resultadoRepository = new ResultadoPruebaRepository();
        this.pacienteRepository = new PacienteRepository();
        this.psicologoRepository = new PsicologoRepository();
    }
    
    async getAllPruebas() {
        try {
            const pruebas = await this.pruebaRepository.findAllWithPreguntas();
            return createSuccessResponse(PruebaDTO.fromArray(pruebas));
        } catch (error) {
            throw createErrorResponse('Error retrieving tests', 500, error.message);
        }
    }
    
    async getPruebaById(id) {
        try {
            if (!validateUUID(id)) {
                throw createErrorResponse('Invalid test ID format', 400);
            }
            
            const prueba = await this.pruebaRepository.findByIdWithPreguntas(id);
            
            if (!prueba) {
                throw createErrorResponse('Test not found', 404);
            }
            
            return createSuccessResponse(new PruebaDTO(prueba));
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error retrieving test', 500, error.message);
        }
    }
    
    async createPrueba(pruebaData, currentUser) {
        const transaction = await sequelize.transaction();
        
        try {
            // Authorization check (only psychologists and admins can create tests)
            if (!['psicologo', 'admin'].includes(currentUser.role)) {
                throw createErrorResponse('Access denied - Psychologist or Admin required', 403);
            }
            
            // Create the test - only include fields that exist in the database
            const prueba = await this.pruebaRepository.create({
                titulo: pruebaData.titulo,
                descripcion: pruebaData.descripcion,
                activa: pruebaData.activa !== undefined ? pruebaData.activa : true
            }, transaction);
            
            // Create associated questions if provided
            if (pruebaData.preguntas && pruebaData.preguntas.length > 0) {
                const preguntasData = pruebaData.preguntas.map(pregunta => ({
                    ...pregunta,
                    idPrueba: prueba.id
                }));
                
                await this.preguntaRepository.bulkCreate(preguntasData, transaction);
            }
            
            await transaction.commit();
            
            // Fetch the complete test with questions
            const pruebaCompleta = await this.pruebaRepository.findByIdWithPreguntas(prueba.id);
            
            return createSuccessResponse(new PruebaDTO(pruebaCompleta), 201);
        } catch (error) {
            await transaction.rollback();
            if (error.statusCode) throw error;
            throw createErrorResponse('Error creating test', 500, error.message);
        }
    }
    
    async updatePrueba(id, updateData, currentUser) {
        const transaction = await sequelize.transaction();
        
        try {
            if (!validateUUID(id)) {
                throw createErrorResponse('Invalid test ID format', 400);
            }
            
            // Authorization check
            if (!['psicologo', 'admin'].includes(currentUser.role)) {
                throw createErrorResponse('Access denied - Psychologist or Admin required', 403);
            }
            
            const prueba = await this.pruebaRepository.findById(id);
            if (!prueba) {
                throw createErrorResponse('Test not found', 404);
            }
            
            // Update test basic info
            await this.pruebaRepository.update(id, {
                titulo: updateData.titulo,
                descripcion: updateData.descripcion,
                activa: updateData.activa
            }, transaction);
            
            // Update questions if provided
            if (updateData.preguntas) {
                // Delete existing questions
                await this.preguntaRepository.deleteByPruebaId(id, transaction);
                
                // Create new questions
                if (updateData.preguntas.length > 0) {
                    const preguntasData = updateData.preguntas.map(pregunta => ({
                        ...pregunta,
                        idPrueba: id
                    }));
                    
                    await this.preguntaRepository.bulkCreate(preguntasData, transaction);
                }
            }
            
            await transaction.commit();
            
            const pruebaActualizada = await this.pruebaRepository.findByIdWithPreguntas(id);
            
            return createSuccessResponse(new PruebaDTO(pruebaActualizada));
        } catch (error) {
            await transaction.rollback();
            if (error.statusCode) throw error;
            throw createErrorResponse('Error updating test', 500, error.message);
        }
    }
    
    async deletePrueba(id, currentUser) {
        try {
            if (!validateUUID(id)) {
                throw createErrorResponse('Invalid test ID format', 400);
            }
            
            // Authorization check (only admin can delete)
            if (currentUser.role !== 'admin') {
                throw createErrorResponse('Access denied - Admin required', 403);
            }
            
            const prueba = await this.pruebaRepository.findById(id);
            if (!prueba) {
                throw createErrorResponse('Test not found', 404);
            }
            
            await this.pruebaRepository.delete(id);
            
            return createSuccessResponse({ message: 'Test deleted successfully' });
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error deleting test', 500, error.message);
        }
    }
    
    async submitTestResult(resultData, currentUser) {
        const transaction = await sequelize.transaction();
        
        try {
            const { idPrueba, idPaciente, respuestas, interpretacion, puntuacionTotal, puntuacionPromedio } = resultData;
            
            // Validaciones
            if (!validateUUID(idPrueba) || !validateUUID(idPaciente)) {
                throw createErrorResponse('ID inválido de prueba o paciente', 400);
            }
            
            if (!Array.isArray(respuestas) || respuestas.length === 0) {
                throw createErrorResponse('Las respuestas son requeridas', 400);
            }
            
            // Verificar que la prueba existe
            const prueba = await this.pruebaRepository.findByIdWithPreguntas(idPrueba);
            if (!prueba) {
                throw createErrorResponse('Prueba no encontrada', 404);
            }
            
            // Verificar que el paciente existe
            const paciente = await this.pacienteRepository.findById(idPaciente);
            if (!paciente) {
                throw createErrorResponse('Paciente no encontrado', 404);
            }
            
            // Validar autorización
            if (currentUser.role === 'paciente' && currentUser.userId !== idPaciente) {
                throw createErrorResponse('No autorizado', 403);
            }
            
            // Crear el resultado con el campo resultado como JSON string
            const resultado = await this.resultadoRepository.create({
                idPrueba,
                idPaciente,
                resultado: JSON.stringify(respuestas),  // Convertir respuestas a string
                respuestas,  // Este campo se usa para el DTO pero no se guarda
                interpretacion,
                puntuacionTotal,
                puntuacionPromedio
            }, transaction);
            
            await transaction.commit();
            
            return createSuccessResponse(resultado, 201);
        } catch (error) {
            await transaction.rollback();
            if (error.statusCode) throw error;
            throw createErrorResponse('Error al guardar el resultado', 500, error.message);
        }
    }
    
    async getResultadosByPaciente(pacienteId, currentUser) {
        try {
            if (!pacienteId || !validateUUID(pacienteId)) {
                throw createErrorResponse('Invalid patient ID format', 400);
            }
            
            const paciente = await this.pacienteRepository.findById(pacienteId);
            if (!paciente) {
                throw createErrorResponse('Patient not found', 404);
            }
            
            // Authorization check
            if (!this.isAuthorizedToViewResults(currentUser, paciente)) {
                throw createErrorResponse('Access denied', 403);
            }
            
            const resultados = await this.resultadoRepository.findByPacienteId(pacienteId);
            
            console.log('Raw resultados from repository:', JSON.stringify(resultados, null, 2));
            
            const resultadosDTO = ResultadoPruebaDTO.fromArray(resultados);
            
            console.log('Resultados DTO:', JSON.stringify(resultadosDTO, null, 2));
            
            return createSuccessResponse(resultadosDTO);
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error retrieving test results', 500, error.message);
        }
    }
    
    async getResultadosByPrueba(pruebaId, currentUser) {
        try {
            if (!validateUUID(pruebaId)) {
                throw createErrorResponse('Invalid test ID format', 400);
            }
            
            // Authorization check (only psychologists and admins can view all results)
            if (!['psicologo', 'admin'].includes(currentUser.role)) {
                throw createErrorResponse('Access denied - Psychologist or Admin required', 403);
            }
            
            const resultados = await this.resultadoRepository.findByPruebaId(pruebaId);
            
            return createSuccessResponse(ResultadoPruebaDTO.fromArray(resultados));
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error retrieving test results', 500, error.message);
        }
    }
    
    async createPregunta(preguntaData, currentUser) {
        try {
            // Authorization check (only psychologists and admins can create questions)
            if (!['psicologo', 'admin'].includes(currentUser.role)) {
                throw createErrorResponse('Access denied - Psychologist or Admin required', 403);
            }
            
            // Verify that the test exists
            const prueba = await this.pruebaRepository.findById(preguntaData.idPrueba);
            if (!prueba) {
                throw createErrorResponse('Test not found', 404);
            }
            
            // Create the question
            const pregunta = await this.preguntaRepository.create({
                idPrueba: preguntaData.idPrueba,
                enunciado: preguntaData.enunciado,
                opciones: preguntaData.opciones
            });
            
            return createSuccessResponse(new PreguntaDTO(pregunta), 201);
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error creating question', 500, error.message);
        }
    }
    
    // Private helper methods
    calculateTestScores(respuestas, preguntas) {
        let puntuacionTotal = 0;
        let totalPeso = 0;
        
        respuestas.forEach((respuesta, index) => {
            const pregunta = preguntas[index];
            if (pregunta) {
                const peso = pregunta.pesoEvaluativo || 1;
                puntuacionTotal += respuesta.valor * peso;
                totalPeso += peso;
            }
        });
        
        const puntuacionPromedio = totalPeso > 0 ? puntuacionTotal / totalPeso : 0;
        
        return { puntuacionTotal, puntuacionPromedio };
    }
    
    generateInterpretation(puntuacionPromedio) {
        if (puntuacionPromedio >= 4) {
            return 'Nivel alto - Requiere atención especializada';
        } else if (puntuacionPromedio >= 3) {
            return 'Nivel moderado - Se recomienda seguimiento';
        } else if (puntuacionPromedio >= 2) {
            return 'Nivel bajo-moderado - Observación recomendada';
        } else {
            return 'Nivel bajo - Dentro de parámetros normales';
        }
    }
    
    async getPreguntaById(id) {
        try {
            if (!validateUUID(id)) {
                throw createErrorResponse('Invalid question ID format', 400);
            }
            
            const pregunta = await this.preguntaRepository.findById(id);
            
            if (!pregunta) {
                throw createErrorResponse('Question not found', 404);
            }
            
            return createSuccessResponse(new PreguntaDTO(pregunta));
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error retrieving question', 500, error.message);
        }
    }

    async getResultadoById(resultadoId, currentUser) {
        try {
            if (!validateUUID(resultadoId)) {
                throw createErrorResponse('ID de resultado inválido', 400);
            }
            
            const resultado = await this.resultadoRepository.model.findOne({
                where: { id: resultadoId },
                include: [{
                    model: this.pruebaRepository.model,
                    as: 'Prueba',
                    include: [{
                        model: this.preguntaRepository.model,
                        as: 'Preguntas'
                    }]
                }]
            });
            
            if (!resultado) {
                throw createErrorResponse('Resultado no encontrado', 404);
            }
            
            // Verificación de autorización
            if (currentUser.role === 'paciente') {
                if (currentUser.userId !== resultado.idPaciente) {
                    throw createErrorResponse('No autorizado', 403);
                }
            } else if (currentUser.role === 'psicologo') {
                const paciente = await this.pacienteRepository.findById(resultado.idPaciente);
                if (!paciente || paciente.idPsicologo !== currentUser.userId) {
                    throw createErrorResponse('No autorizado', 403);
                }
            } else if (currentUser.role !== 'admin') {
                throw createErrorResponse('No autorizado', 403);
            }

            // Parsear el campo resultado que está como string
            let respuestasParsed = [];
            try {
                if (resultado.resultado) {
                    respuestasParsed = JSON.parse(resultado.resultado);
                }
            } catch (e) {
                console.error('Error parsing resultado:', e);
                respuestasParsed = [];
            }

            // Emparejar las respuestas con las preguntas
            const respuestasCompletas = [];
            if (resultado.Prueba?.Preguntas && Array.isArray(respuestasParsed)) {
                respuestasParsed.forEach((resp, index) => {
                    const pregunta = resultado.Prueba.Preguntas.find(p => p.id === resp.idPregunta);
                    if (pregunta) {
                        const respuestaCompleta = {
                            idPregunta: resp.idPregunta,
                            pregunta: pregunta.enunciado,
                            respuesta: resp.respuesta,
                            opciones: pregunta.opciones,
                            puntuacion: resp.puntuacion || 0
                        };
                        respuestasCompletas.push(respuestaCompleta);
                    } else {
                        // Si no se encuentra la pregunta, agregar respuesta sin detalles
                        respuestasCompletas.push({
                            idPregunta: resp.idPregunta,
                            pregunta: `Pregunta ${index + 1}`,
                            respuesta: resp.respuesta,
                            opciones: [],
                            puntuacion: resp.puntuacion || 0
                        });
                    }
                });
            }
            
            // Añadir las respuestas completas al resultado
            const resultadoFinal = {
                ...resultado.toJSON(),
                respuestas: respuestasCompletas
            };
            
            return createSuccessResponse(resultadoFinal);
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error al obtener el resultado', 500, error.message);
        }
    }

    isAuthorizedToSubmitTest(currentUser, paciente) {
        // Patient can submit their own tests
        if (currentUser.userId === paciente.id) return true;
        
        // Psychologist can submit tests for their patients
        if (currentUser.role === 'psicologo' && paciente.idPsicologo === currentUser.userId) {
            return true;
        }
        
        // Admin can submit tests for anyone
        if (currentUser.role === 'admin') return true;
        
        return false;
    }
    
    isAuthorizedToViewResults(currentUser, paciente) {
        // Patient can view their own results
        if (currentUser.userId === paciente.id) return true;
        
        // Psychologist can view results of their patients
        if (currentUser.role === 'psicologo' && paciente.idPsicologo === currentUser.userId) {
            return true;
        }
        
        // Admin can view all results
        if (currentUser.role === 'admin') return true;
        
        return false;
    }

    async createResultadoPrueba(resultData, currentUser) {
        // This is an alias for submitTestResult
        return await this.submitTestResult(resultData, currentUser);
    }
}
