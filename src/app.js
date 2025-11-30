require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Rutas básicas
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido Backend' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor activo' });
});

// Rutas de autenticación
app.use('/auth', authRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});
