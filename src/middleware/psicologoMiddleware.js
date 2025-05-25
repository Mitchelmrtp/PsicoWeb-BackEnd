const psicologoMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'psicologo') {
        return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de psicólogo.' });
    }
    next();
};

export default psicologoMiddleware;