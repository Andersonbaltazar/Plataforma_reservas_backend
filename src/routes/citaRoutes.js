
const express = require('express');
const router = express.Router();
const citaController = require('../cita/cita.controller');
const { mockUserMiddleware } = require('../middlewares/mock-user.middleware');

router.use(mockUserMiddleware);
router.post('/', citaController.create);
router.get('/:id', citaController.getById);
router.put('/:id/cancelar', citaController.cancelar);
router.get('/medico/:medicoId/disponibilidad', citaController.getDisponibilidad);

module.exports = router;
