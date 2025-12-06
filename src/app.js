require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const passport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');
const medicoRoutes = require('./routes/medicoRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const citaRoutes = require('./routes/citaRoutes');
const app = express();

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
      auth: '/auth',
      medicos: '/medicos',
      pacientes: '/paciente',
      citas: '/citas',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor activo' });
});

app.use('/auth', authRoutes);
app.use('/medicos', medicoRoutes);
app.use('/pacientes', pacienteRoutes);
app.use('/citas', citaRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🗄️  Base de datos: Supabase PostgreSQL`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
