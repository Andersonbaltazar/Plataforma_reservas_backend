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
  eliminarDisponibilidad
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

// 🟢 GET: Obtener disponibilidades de un médico
router.get('/:id/disponibilidades', obtenerDisponibilidades);

// 🟢 DELETE: Eliminar disponibilidad
router.delete('/disponibilidad/:disponibilidadId', eliminarDisponibilidad);

// ===== ENDPOINTS DE CITAS =====

// 🟢 GET: Obtener citas de un médico
router.get('/:id/citas', obtenerCitasMedico);

// 🟢 PUT: Actualizar estado de cita
router.put('/cita/:citaId', actualizarEstadoCita);

module.exports = router;
