const express = require('express');
const router = express.Router();

const {
    obtenerCitasPaciente,
    crearCita
} = require('../controllers/pacienteController');

const {
    obtenerMedicos
} = require('../controllers/medicoController');

// ===== ENDPOINTS DE PACIENTE =====

// GET: Obtener citas del paciente 
router.get('/citas', obtenerCitasPaciente);

// GET: Obtener citas por ID específico
router.get('/:id/citas', obtenerCitasPaciente);

// POST: Crear nueva cita
router.post('/citas', crearCita);

// PUT: Actualizar cita (motivo)
const { actualizarCita } = require('../controllers/pacienteController');
router.put('/citas/:id', actualizarCita);

// GET: Obtener lista de médicos disponibles
router.get('/medicos-disponibles', obtenerMedicos);

module.exports = router;
