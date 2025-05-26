const adminMiddleware = (req, res, next) => {
    const user = req.user;
    
    if (!user) {
        return res.status(401).json({ message: 'No autorizado' });
    }
    
    // Permitir tanto a administradores como a psicólogos
    if (user.role === 'admin' || user.role === 'psicologo') {
        next();
    } else {
        return res.status(403).json({ 
            message: 'No tiene permisos suficientes para realizar esta acción' 
        });
    }
};

export default adminMiddleware;