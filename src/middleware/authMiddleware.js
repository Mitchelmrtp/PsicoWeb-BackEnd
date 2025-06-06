import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No authorization header' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        
        console.log('Token recibido:', token);
        console.log('Usuario decodificado:', decoded);
        
        next();
    } catch (error) {
        console.error('Error de autenticación:', error);
        return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
};

export default authMiddleware;