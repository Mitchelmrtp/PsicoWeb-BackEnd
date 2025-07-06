import express from "express";
import cors from "cors";
import authMiddleware from "./src/middleware/authMiddleware.js";
import authRoutes from "./src/routes/authRoutes.js";
import psicologoRoutes from "./src/routes/psicologoRoutes.js";
import pacienteRoutes from "./src/routes/pacienteRoutes.js";
import calendarioRoutes from "./src/routes/calendarioRoutes.js";
import sesionRoutes from "./src/routes/sesionRoutes.js";
import pruebaRoutes from "./src/routes/pruebaRoutes.js";
import disponibilidadPsicologoRoutes from "./src/routes/disponibilidadPsicologoRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";
import objetivoRoutes from "./src/routes/objetivoRoutes.js";
import ejercicioRoutes from "./src/routes/ejercicioRoutes.js";
import registroEmocionRoutes from "./src/routes/registroEmocionRoutes.js";
import informeRoutes from "./src/routes/informeRoutes.js";  // Agregado para informes

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow any origin in development
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:5173', // Vite dev server default
      'http://localhost:4173',  // Vite preview default
      'http://localhost:5000',  // Current frontend port
      'http://127.0.0.1:5173',
      'http://127.0.0.1:4173',
      'http://127.0.0.1:5000'
    ];
    
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      console.log(`CORS: Allowing origin: ${origin || 'No origin'}`);
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Log requests middleware for debugging
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  
  // Log auth headers (partially)
  if (req.headers.authorization) {
    const authPreview = req.headers.authorization.substring(0, 15) + '...';
    console.log(`Auth header present: ${authPreview}`);
  } else {
    console.log(`No auth header present`);
  }
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});

app.use(express.json());

app.use("/uploads", express.static("public/uploads"));

app.get("/", (req, res) => {
  return res.json({ result: "OK" });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  return res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    service: "PsicoWeb Backend"
  });
});

// Debug endpoint for authentication testing
app.get("/api/auth/debug", (req, res) => {
  const authHeader = req.headers.authorization;
  return res.json({
    hasAuthHeader: !!authHeader,
    authHeaderFormat: authHeader ? authHeader.substring(0, 20) + '...' : null,
    jwtSecretConfigured: !!process.env.JWT_SECRET,
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check database data
app.get("/api/debug/data", authMiddleware, async (req, res) => {
  try {
    const { Sesion, Psicologo, Paciente, User } = await import('./src/models/index.js');
    
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;
    
    // Get user info
    const user = await User.findByPk(userId);
    
    // Get sessions count
    const allSessions = await Sesion.count();
    const userSessions = await Sesion.count({
      where: userRole === 'psicologo' ? { idPsicologo: userId } : { idPaciente: userId }
    });
    
    // Get psychologists count
    const psychologistsCount = await Psicologo.count();
    const patientsCount = await Paciente.count();
    
    // Check if current user is a psychologist
    const isPsychologist = await Psicologo.findByPk(userId);
    const isPatient = await Paciente.findByPk(userId);
    
    return res.json({
      currentUser: {
        id: userId,
        role: userRole,
        email: user?.email,
        name: user?.name,
        isPsychologist: !!isPsychologist,
        isPatient: !!isPatient
      },
      databaseStats: {
        totalSessions: allSessions,
        userSessions: userSessions,
        totalPsychologists: psychologistsCount,
        totalPatients: patientsCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Rutas de la API
app.use("/api", authRoutes);
app.use("/api/psicologos", psicologoRoutes);
app.use("/api/pacientes", pacienteRoutes);
app.use("/api/calendario", calendarioRoutes);
app.use("/api/sesiones", sesionRoutes);
app.use("/api/pruebas", pruebaRoutes);
app.use("/api/disponibilidad", disponibilidadPsicologoRoutes);
app.use("/api/notificaciones", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/objetivos", objetivoRoutes);
app.use("/api/ejercicios", ejercicioRoutes);
app.use("/api/emociones", registroEmocionRoutes);

// Rutas de Informes
app.use("/api/informes", informeRoutes);  // Nueva ruta para informes

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
