
const medicoService = require('./medico.service');

class MedicoController {
    async getAll(req, res) {
        try {
            const filters = {
                especialidad: req.query.especialidad
            };

            const medicos = await medicoService.getAllAvailable(filters);

            res.json({
                success: true,
                data: medicos,
                count: medicos.length
            });
        } catch (error) {
            console.error('Error en getAll:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener médicos'
            });
        }
    }

    async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const medico = await medicoService.getById(id);
            if (!medico) {
                return res.status(404).json({
                    success: false,
                    error: 'Médico no encontrado'
                });
            }
            res.json({
                success: true,
                data: medico
            });
        } catch (error) {
            console.error('Error en getById:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener el médico'
            });
        }
    }
}

module.exports = new MedicoController();
