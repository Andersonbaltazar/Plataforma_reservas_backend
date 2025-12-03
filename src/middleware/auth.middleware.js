
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Token no proporcionado'
            });
        }
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = {
            id: decoded.userId || decoded.id,
            email: decoded.email,
            roleId: decoded.roleId
        };

        next();
    } catch (error) {
        console.error('Error en authMiddleware:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expirado'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Error al verificar autenticación'
        });
    }
};

const requirePaciente = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no autenticado'
            });
        }
        next();
    } catch (error) {
        console.error('Error en requirePaciente:', error);
        res.status(500).json({
            success: false,
            error: 'Error al verificar permisos'
        });
    }
};

module.exports = {
    authMiddleware,
    requirePaciente
};
