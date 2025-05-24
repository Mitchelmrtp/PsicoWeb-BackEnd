import { Router } from "express";
import citaController from "../controllers/citaController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.post("/crear", authMiddleware, citaController.crearCita);
router.put("/reprogramar", authMiddleware, citaController.reprogramarCita);

export default router;
