
const express = require('express');
const router = express.Router();
const pacienteController = require('../paciente/paciente.controller');
const detallesPacienteController = require('../detalles-paciente/detalles-paciente.controller');
const { authMiddleware, requirePaciente } = require('../middleware/auth.middleware');
const { mockUserMiddleware } = require('../middleware/mock-user.middleware');

// PARA TESTING: Usar mock user en lugar de autenticación real
// Descomentar las siguientes líneas cuando termine el módulo de autenticación
// router.use(authMiddleware);
// router.use(requirePaciente);


router.use(mockUserMiddleware);
router.get('/profile', pacienteController.getProfile);
router.put('/profile', pacienteController.updateProfile);
router.get('/citas', pacienteController.getCitas);
router.get('/detalles', detallesPacienteController.getDetalles);
router.put('/detalles', detallesPacienteController.updateDetalles);

module.exports = router;
