import Sesion from "../models/Sesion.js";
import Psicologo from "../models/Psicologo.js";
import Paciente from "../models/Paciente.js";
import User from "../models/User.js";
import Notificacion from "../models/Notificacion.js";
import { Op } from "sequelize";
import Joi from "joi";

const sesionSchema = Joi.object({
  idPsicologo: Joi.string().required(),
  idPaciente: Joi.string().required(),
  fecha: Joi.date().required(),
  horaInicio: Joi.string().required(),
  horaFin: Joi.string().required(),
  notas: Joi.string().optional(),
  estado: Joi.string()
    .valid("programada", "completada", "cancelada")
    .default("programada"),
});

const updateSchema = Joi.object({
  fecha: Joi.date().optional(),
  horaInicio: Joi.string().optional(),
  horaFin: Joi.string().optional(),
  notas: Joi.string().optional(),
  estado: Joi.string()
    .valid("programada", "completada", "cancelada")
    .optional(),
});

export const findAll = async (req, res) => {
  try {
    const { startDate, endDate, estado } = req.query;
    const where = {};
    const userId = req.user.userId || req.user.id;

    console.log('Finding sessions for user:', userId, 'with role:', req.user.role);
    console.log('Query parameters:', { startDate, endDate, estado });

    if (startDate && endDate) {
      where.fecha = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      where.fecha = {
        [Op.gte]: startDate,
      };
    } else if (endDate) {
      where.fecha = {
        [Op.lte]: endDate,
      };
    }

    if (estado) {
      where.estado = estado;
    }

    // Filter by user role and ID
    if (req.user.role !== "admin") {
      console.log('User role:', req.user.role, 'User ID:', userId);
      
      if (req.user.role === "psicologo") {
        where.idPsicologo = userId;
        console.log('Filtering for psychologist sessions with ID:', userId);
      } else if (req.user.role === "paciente") {
        where.idPaciente = userId;
        console.log('Filtering for patient sessions with ID:', userId);
      } else {
        // Fallback: check if user exists as psychologist, otherwise assume patient
        const psicologo = await Psicologo.findByPk(userId);
        if (psicologo) {
          where.idPsicologo = userId;
          console.log('User found as psychologist, filtering sessions');
        } else {
          where.idPaciente = userId;
          console.log('User not found as psychologist, filtering as patient');
        }
      }
    }

    console.log('Final where clause:', where);

    const sesiones = await Sesion.findAll({
      where,
      include: [
        {
          model: Psicologo,
          as: "Psicologo",
          include: [
            {
              model: User,
              attributes: ["name", "first_name", "last_name", "email"],
            },
          ],
        },
        {
          model: Paciente,
          as: "Paciente",
          include: [
            {
              model: User,
              attributes: ["name", "first_name", "last_name", "email"],
            },
          ],
        },
      ],
      order: [
        ["fecha", "ASC"],
        ["horaInicio", "ASC"],
      ],
    });

    console.log(`Found ${sesiones.length} sessions for user ${userId}`);
    
    res.status(200).json(sesiones);
  } catch (error) {
    console.error('Error in findAll sessions:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const findById = async (req, res) => {
  try {
    const sesion = await Sesion.findByPk(req.params.id, {
      include: [
        {
          model: Psicologo,
          as: "Psicologo",
          include: [
            {
              model: User,
              attributes: ["name", "first_name", "last_name", "email"],
            },
          ],
        },
        {
          model: Paciente,
          as: "Paciente",
          include: [
            {
              model: User,
              attributes: ["name", "first_name", "last_name", "email"],
            },
          ],
        },
      ],
    });

    if (!sesion) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (
      req.user.role !== "admin" &&
      req.user.userId !== sesion.idPsicologo &&
      req.user.userId !== sesion.idPaciente
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view this session" });
    }

    res.status(200).json(sesion);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const create = async (req, res) => {
  const { error } = sesionSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "Validation error", error: error.details });
  }

  try {
    const { idPsicologo, idPaciente } = req.body;

    const psicologo = await Psicologo.findByPk(idPsicologo);
    if (!psicologo) {
      return res.status(404).json({ message: "Psychologist not found" });
    }

    const paciente = await Paciente.findByPk(idPaciente);
    if (!paciente) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (
      req.user.role !== "admin" &&
      req.user.userId !== idPsicologo &&
      req.user.userId !== idPaciente
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to create this session" });
    }

    const sesion = await Sesion.create(req.body);

    const receptorId =
      req.user.userId === idPsicologo ? idPaciente : idPsicologo;

    await Notificacion.create({
      idUsuario: receptorId,
      tipo: "sesion",
      contenido: `Nueva sesión programada para el ${req.body.fecha} de ${req.body.horaInicio} a ${req.body.horaFin}.`,
      leido: false,
    });

    res.status(201).json(sesion);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const update = async (req, res) => {
  const { error } = updateSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "Validation error", error: error.details });
  }

  try {
    const sesion = await Sesion.findByPk(req.params.id);
    if (!sesion) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (
      req.user.role !== "admin" &&
      req.user.userId !== sesion.idPsicologo &&
      req.user.userId !== sesion.idPaciente
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this session" });
    }

    if (req.user.userId === sesion.idPaciente && req.user.role !== "admin") {
      const { estado, fecha, horaInicio, horaFin, notas } = req.body;
      if (
        (estado && estado !== "cancelada") ||
        fecha ||
        horaInicio ||
        horaFin ||
        notas
      ) {
        return res
          .status(403)
          .json({ message: "As a patient, you can only cancel the session" });
      }
    }

    await sesion.update(req.body);

    const receptorId =
      req.user.userId === sesion.idPsicologo
        ? sesion.idPaciente
        : sesion.idPsicologo;
    let contenido = null;

    if (req.body.estado === "cancelada") {
      contenido = "Una de tus sesiones ha sido cancelada.";
    } else if (req.body.fecha || req.body.horaInicio || req.body.horaFin) {
      contenido = `La sesión ha sido modificada: ${
        req.body.fecha || sesion.fecha
      }, ${req.body.horaInicio || sesion.horaInicio} - ${
        req.body.horaFin || sesion.horaFin
      }.`;
    }

    if (contenido) {
      await Notificacion.create({
        idUsuario: receptorId,
        tipo: "sesion",
        contenido,
        leido: false,
      });
    }

    res.status(200).json(sesion);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const sesion = await Sesion.findByPk(req.params.id);
    if (!sesion) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (req.user.role !== "admin" && req.user.userId !== sesion.idPsicologo) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this session" });
    }

    await sesion.destroy();

    res.status(200).json({ message: "Session successfully deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  findAll,
  findById,
  create,
  update,
  remove,
};
