// Cargar variables de entorno PRIMERO, antes de cualquier otra importación
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const passport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');
const medicoRoutes = require('./routes/medicoRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const citaRoutes = require('./routes/citaRoutes');

// Verificar que las variables críticas estén cargadas
if (process.env.NODE_ENV !== 'production') {
  console.log('📋 Variables de entorno cargadas:');
  console.log(`   PORT: ${process.env.PORT || 'no configurado'}`);
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ configurado' : '❌ no configurado'}`);
  console.log(`   GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? '✅ configurado' : '❌ no configurado'}`);
  console.log(`   GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? '✅ configurado' : '❌ no configurado'}`);
}

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a Plataforma de Reservas Backend',
    version: '1.0.0',
    endpoints: {
      medicos: '/api/medicos',
      pacientes: '/api/paciente',
      citas: '/api/citas',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor activo' });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);
app.use('/api/medicos', medicoRoutes);
app.use('/api/paciente', pacienteRoutes);
app.use('/api/citas', citaRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🗄️  Base de datos: Supabase PostgreSQL`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
