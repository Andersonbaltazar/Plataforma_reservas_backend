const express = require('express');
const router = express.Router();

// Importar controladores
const { 
  registrarMedico,
  obtenerMedicos,
  obtenerMedicoPorId,
  actualizarMedico
} = require('../controllers/medicoController');

const {
  agregarDisponibilidad,
  obtenerDisponibilidades,
  eliminarDisponibilidad,
  marcarRangoNoDisponible,
  obtenerCalendarioMes,
  eliminarRangoNoDisponible
} = require('../controllers/disponibilidadController');

const {
  obtenerCitasMedico,
  actualizarEstadoCita
} = require('../controllers/citaController');

// ===== ENDPOINTS DE MÉDICO =====

// 🟢 POST: Registrar nuevo médico
router.post('/registro', registrarMedico);

// 🟢 GET: Obtener todos los médicos
router.get('/', obtenerMedicos);

// 🟢 GET: Obtener un médico por ID
router.get('/:id', obtenerMedicoPorId);

// 🟢 PUT: Actualizar datos del médico
router.put('/:id', actualizarMedico);

// ===== ENDPOINTS DE DISPONIBILIDAD =====

// 🟢 POST: Agregar disponibilidad horaria
router.post('/:id/disponibilidad', agregarDisponibilidad);

// 🟢 POST: Marcar múltiples días NO disponibles (rango)
router.post('/:id/disponibilidad-rango', marcarRangoNoDisponible);

// 🟢 GET: Obtener disponibilidades de un médico
router.get('/:id/disponibilidades', obtenerDisponibilidades);

// 🟢 GET: Obtener calendario del mes (disponibles vs no disponibles)
router.get('/:id/calendario', obtenerCalendarioMes);

// 🟢 DELETE: Eliminar disponibilidad
router.delete('/disponibilidad/:disponibilidadId', eliminarDisponibilidad);

// 🟢 DELETE: Eliminar rango de marcaciones (dejar disponible todo el rango)
router.delete('/:id/disponibilidad-rango', eliminarRangoNoDisponible);

// ===== ENDPOINTS DE CITAS =====

// 🟢 GET: Obtener citas de un médico
router.get('/:id/citas', obtenerCitasMedico);

// 🟢 PUT: Actualizar estado de cita
router.put('/cita/:citaId', actualizarEstadoCita);

module.exports = router;
