const express = require('express');
const passport = require('../config/passport');
const { register, login, me } = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Autenticación por credenciales
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, me);

// OAuth Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Redirigir al frontend con el token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// OAuth GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Redirigir al frontend con el token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

module.exports = router;

