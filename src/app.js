const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();

const medicoRoutes = require('./routes/medicoRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const citaRoutes = require('./routes/citaRoutes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use('/api/medicos', medicoRoutes);
app.use('/api/paciente', pacienteRoutes);
app.use('/api/citas', citaRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🗄️  Base de datos: Supabase PostgreSQL`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
