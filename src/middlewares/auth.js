const jwt = require('jsonwebtoken');
const { findUserById } = require('../models/users');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    // Verificar JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no configurado en variables de entorno');
      return res.status(500).json({ error: 'Error de configuración del servidor' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(403).json({ error: 'Token expirado' });
        }
        if (err.name === 'JsonWebTokenError') {
          return res.status(403).json({ error: 'Token inválido' });
        }
        return res.status(403).json({ error: 'Error al verificar token' });
      }

      // Buscar usuario en BD
      const user = await findUserById(decoded.userId || decoded.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Verificar si el usuario está activo
      if (user.activo === false) {
        return res.status(403).json({ error: 'Cuenta desactivada' });
      }

      // Asignar usuario al request
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Error en authenticateToken:', error);
    res.status(500).json({ error: 'Error al autenticar usuario' });
  }
};

module.exports = { authenticateToken };


