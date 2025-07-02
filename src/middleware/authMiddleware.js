import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        console.log('Auth header received:', authHeader ? 'Present' : 'Missing');
        
        if (!authHeader) {
            console.log('No authorization header provided');
            return res.status(401).json({ 
                message: 'No authorization header',
                error: 'MISSING_AUTH_HEADER'
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            console.log('No token in authorization header');
            return res.status(401).json({ 
                message: 'No token provided',
                error: 'MISSING_TOKEN'
            });
        }

        console.log('Attempting to verify token...');
        
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not configured');
            return res.status(500).json({ 
                message: 'Server configuration error',
                error: 'MISSING_JWT_SECRET'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Ensure both userId and id are available for compatibility
        req.user = {
            ...decoded,
            id: decoded.userId || decoded.id,
            userId: decoded.userId || decoded.id
        };
        
        console.log('Token verified successfully for user:', req.user.id || req.user.userId);
        
        next();
    } catch (error) {
        console.error('Authentication error:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        let errorMessage = 'Invalid token';
        let errorCode = 'INVALID_TOKEN';
        
        if (error.name === 'TokenExpiredError') {
            errorMessage = 'Token has expired';
            errorCode = 'TOKEN_EXPIRED';
        } else if (error.name === 'JsonWebTokenError') {
            errorMessage = 'Malformed token';
            errorCode = 'MALFORMED_TOKEN';
        }
        
        return res.status(401).json({ 
            message: errorMessage, 
            error: errorCode,
            details: error.message 
        });
    }
};

export default authMiddleware;