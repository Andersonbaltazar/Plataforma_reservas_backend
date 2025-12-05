
const express = require('express');
const router = express.Router();
const citaController = require('../cita/cita.controller');
const { authMiddleware, requirePaciente } = require('../middleware/auth.middleware');
const { mockUserMiddleware } = require('../middleware/mock-user.middleware');

// PARA TESTING: Usar mock user en lugar de autenticación real
// Descomentar las siguientes líneas cuando termine el módulo de autenticación
// router.use(authMiddleware);
// router.use(requirePaciente);

router.use(mockUserMiddleware);
router.post('/', citaController.create);
router.get('/:id', citaController.getById);
router.put('/:id/cancelar', citaController.cancelar);
router.get('/medico/:medicoId/disponibilidad', citaController.getDisponibilidad);

module.exports = router;
