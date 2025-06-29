import express from "express";
import {
  getNotificacionesNoLeidas,
  marcarComoLeida,
} from "../controllers/notificacionController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/no-leidas", authMiddleware, getNotificacionesNoLeidas);

router.patch("/:id/leido", authMiddleware, marcarComoLeida);

export default router;
