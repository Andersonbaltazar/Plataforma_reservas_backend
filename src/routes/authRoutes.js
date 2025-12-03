const express = require('express');
const passport = require('../config/passport');
const { register, login, me } = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');
const { checkGoogleStrategy, checkGitHubStrategy } = require('../middlewares/oauth');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Autenticación por credenciales
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, me);

// Ruta de error para OAuth
router.get('/error', (req, res) => {
  res.status(500).json({
    error: 'Error en autenticación OAuth',
    message: req.query.message || 'Error desconocido'
  });
});

// OAuth Google
router.get('/google', 
  checkGoogleStrategy,
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  checkGoogleStrategy,
  passport.authenticate('google', { session: false, failureRedirect: '/auth/error' }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?message=Usuario no autenticado`);
      }

      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET no configurado');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?message=Error de configuración`);
      }

      const token = jwt.sign(
        { 
          userId: req.user.id,
          email: req.user.email,
          roleId: req.user.roleId || 1
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Redirigir al frontend con el token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Error en callback de Google OAuth:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/error?message=Error al generar token`);
    }
  }
);

// OAuth GitHub
router.get('/github', 
  checkGitHubStrategy,
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
  checkGitHubStrategy,
  passport.authenticate('github', { session: false, failureRedirect: '/auth/error' }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?message=Usuario no autenticado`);
      }

      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET no configurado');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?message=Error de configuración`);
      }

      const token = jwt.sign(
        { 
          userId: req.user.id,
          email: req.user.email,
          roleId: req.user.roleId || 1
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Redirigir al frontend con el token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Error en callback de GitHub OAuth:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/error?message=Error al generar token`);
    }
  }
);

module.exports = router;

