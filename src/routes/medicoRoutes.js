const express = require('express');
const router = express.Router();

// Importar controladores
const {
  registrarMedico,
  obtenerMedicos,
  obtenerMedicoPorId,
  actualizarMedico,
  obtenerDisponibilidad
} = require('../controllers/medicoController');

const {
  agregarDisponibilidad,
  obtenerDisponibilidades,
  eliminarDisponibilidad,
  obtenerCalendario
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

// ===== ENDPOINTS DE DISPONIBILIDAD =====

// 🟢 POST: Agregar disponibilidad (marcar día NO disponible)
router.post('/:id/disponibilidad', agregarDisponibilidad);

// 🟢 GET: Obtener disponibilidades de un médico
router.get('/:id/disponibilidades', obtenerDisponibilidades);

// 🟢 GET: Obtener calendario del mes
router.get('/:id/calendario', obtenerCalendario);

// 🟢 DELETE: Eliminar disponibilidad (marcar día como disponible)
router.delete('/disponibilidad/:disponibilidadId', eliminarDisponibilidad);


// 🟢 DELETE: Eliminar disponibilidad (simple)
router.delete('/:id/disponibilidad/:disponibilidadId', eliminarDisponibilidad);

// ===== ENDPOINTS DE CITAS =====

// 🟢 GET: Obtener citas de un médico
router.get('/:id/citas', obtenerCitasMedico);

// 🟢 PUT: Actualizar estado de cita
router.put('/cita/:citaId', actualizarEstadoCita);

// ===== ENDPOINTS DE MÉDICO (GENÉRICAS AL FINAL) =====

// 🟢 GET: Obtener un médico por ID
router.get('/:id', obtenerMedicoPorId);

// 🟢 GET: Obtener disponibilidad calculada
router.get('/:id/disponibilidad', obtenerDisponibilidad);

// 🟢 PUT: Actualizar datos del médico
router.put('/:id', actualizarMedico);

module.exports = router;
