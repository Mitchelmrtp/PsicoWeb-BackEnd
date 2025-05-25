import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import psicologoRoutes from "./src/routes/psicologoRoutes.js";
import pacienteRoutes from "./src/routes/pacienteRoutes.js";
import calendarioRoutes from "./src/routes/calendarioRoutes.js";
import sesionRoutes from "./src/routes/sesionRoutes.js";
import pruebaRoutes from "./src/routes/pruebaRoutes.js";
import disponibilidadPsicologoRoutes from "./src/routes/disponibilidadPsicologoRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta "public/uploads"
app.use("/uploads", express.static("public/uploads"));

app.get("/", (req, res) => {
  return res.json({ result: "OK" });
});

// Rutas de la API
app.use("/api", authRoutes);
app.use("/api/psicologos", psicologoRoutes);
app.use("/api/pacientes", pacienteRoutes);
app.use("/api/calendario", calendarioRoutes);
app.use("/api/sesiones", sesionRoutes);
app.use("/api/pruebas", pruebaRoutes);
app.use("/api/disponibilidad", disponibilidadPsicologoRoutes);

// Manejo de errores de multer
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_TYPES") {
    return res.status(422).json({ message: "Tipo de archivo no permitido" });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(422)
      .json({ message: "El archivo es demasiado grande. Máximo 5MB" });
  }
  next(err);
});

export default app;
