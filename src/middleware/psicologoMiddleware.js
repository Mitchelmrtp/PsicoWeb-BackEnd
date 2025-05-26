const psicologoMiddleware = (req, res, next) => {
    const user = req.user;
    
    if (!user) {
        return res.status(401).json({ message: 'No autorizado' });
    }
    
    // Permitir a psicólogos y administradores
    if (user.role === 'psicologo' || user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ 
            message: 'Solo los psicólogos pueden realizar esta acción' 
        });
    }
};

export default psicologoMiddleware;