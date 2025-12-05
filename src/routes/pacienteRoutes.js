
const express = require('express');
const router = express.Router();
const pacienteController = require('../paciente/paciente.controller');
const detallesPacienteController = require('../detalles-paciente/detalles-paciente.controller');
const { mockUserMiddleware } = require('../middlewares/mock-user.middleware');

router.use(mockUserMiddleware);
router.get('/profile', pacienteController.getProfile);
router.put('/profile', pacienteController.updateProfile);
router.get('/citas', pacienteController.getCitas);
router.get('/detalles', detallesPacienteController.getDetalles);
router.put('/detalles', detallesPacienteController.updateDetalles);

module.exports = router;
