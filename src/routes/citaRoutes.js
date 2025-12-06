
const express = require('express');
const router = express.Router();
const citaController = require('../cita/cita.controller');
const { authenticateToken } = require('../middlewares/auth');

// Todas las rutas de citas requieren autenticación
router.use(authenticateToken);

router.post('/', citaController.create);
router.get('/:id', citaController.getById);
router.put('/:id/cancelar', citaController.cancelar);
router.get('/medico/:medicoId/disponibilidad', citaController.getDisponibilidad);

module.exports = router;
