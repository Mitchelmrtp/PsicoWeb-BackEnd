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
            
            // Create the test
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
        try {
            const { idPrueba, idPaciente, respuestas } = resultData;
            
            if (!validateUUID(idPrueba) || !validateUUID(idPaciente)) {
                throw createErrorResponse('Invalid test or patient ID format', 400);
            }
            
            // Verify test exists
            const prueba = await this.pruebaRepository.findByIdWithPreguntas(idPrueba);
            if (!prueba) {
                throw createErrorResponse('Test not found', 404);
            }
            
            // Verify patient exists and authorization
            const paciente = await this.pacienteRepository.findById(idPaciente);
            if (!paciente) {
                throw createErrorResponse('Patient not found', 404);
            }
            
            // Authorization check
            if (!this.isAuthorizedToSubmitTest(currentUser, paciente)) {
                throw createErrorResponse('Access denied', 403);
            }
            
            // Check if patient already has a result for this test
            const existingResult = await this.resultadoRepository.findByPacienteAndPrueba(idPaciente, idPrueba);
            if (existingResult) {
                throw createErrorResponse('Patient has already completed this test', 409);
            }
            
            // Calculate scores
            const { puntuacionTotal, puntuacionPromedio } = this.calculateTestScores(respuestas, prueba.Preguntas);
            
            // Generate interpretation (simplified logic)
            const interpretacion = this.generateInterpretation(puntuacionPromedio);
            
            // Save result
            const resultado = await this.resultadoRepository.create({
                idPrueba,
                idPaciente,
                resultado: JSON.stringify(respuestas),
                interpretacion,
                puntuacionTotal,
                puntuacionPromedio,
                fechaRealizacion: new Date()
            });
            
            const resultadoCompleto = await this.resultadoRepository.findById(resultado.id);
            
            return createSuccessResponse(new ResultadoPruebaDTO(resultadoCompleto), 201);
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error submitting test result', 500, error.message);
        }
    }
    
    async getResultadosByPaciente(pacienteId, currentUser) {
        try {
            if (!validateUUID(pacienteId)) {
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
            
            return createSuccessResponse(ResultadoPruebaDTO.fromArray(resultados));
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
}
