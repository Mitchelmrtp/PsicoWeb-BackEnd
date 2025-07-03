import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createErrorResponse } from '../utils/responseUtils.js';

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Crear directorio si no existe
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generar nombre único para el archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, extension);
        const safeName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${safeName}_${uniqueSuffix}${extension}`);
    }
});

// Filtro de archivos permitidos
const fileFilter = (req, file, cb) => {
    // Tipos MIME permitidos
    const allowedMimeTypes = [
        // Imágenes
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        // Documentos
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // Texto
        'text/plain',
        'text/csv',
        // Archivos comprimidos
        'application/zip',
        'application/x-rar-compressed'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
    }
};

// Configuración de multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
        files: 1 // Solo un archivo por request
    }
});

// Middleware para manejar errores de multer
export const handleUploadErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json(createErrorResponse('El archivo es demasiado grande. Máximo 10MB', 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json(createErrorResponse('Solo se permite un archivo por mensaje', 400));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json(createErrorResponse('Campo de archivo inesperado', 400));
        }
        return res.status(400).json(createErrorResponse(`Error de subida: ${err.message}`, 400));
    }
    
    if (err.message.includes('Tipo de archivo no permitido')) {
        return res.status(400).json(createErrorResponse(err.message, 400));
    }
    
    next(err);
};

// Middleware principal de subida
export const uploadChatFile = upload.single('archivo');

// Función helper para generar información del archivo
export const getFileInfo = (file) => {
    if (!file) return null;
    
    return {
        nombreArchivo: file.originalname,
        rutaArchivo: `/uploads/chat/${file.filename}`,
        tamanoArchivo: file.size,
        mimeType: file.mimetype
    };
};

// Función para eliminar archivo del sistema
export const deleteFile = (filePath) => {
    try {
        const fullPath = path.join(process.cwd(), 'public', filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};

export default {
    uploadChatFile,
    handleUploadErrors,
    getFileInfo,
    deleteFile
};
