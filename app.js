import express from 'express';
import cors from 'cors';
import authRoutes from './src/routes/authRoutes.js';


const app = express();

app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta "public/uploads"
app.use('/uploads', express.static('public/uploads'));

app.get('/', (req, res) => {
    return res.json({ result: 'OK' });
});

app.use('/api', authRoutes);

// Manejo de errores de multer
app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_TYPES') {
        return res.status(422).json({ message: 'Tipo de archivo no permitido' });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(422).json({ message: 'El archivo es demasiado grande. Máximo 5MB' });
    }
    next(err);
});

export default app;