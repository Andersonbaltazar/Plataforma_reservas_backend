
const detallesPacienteService = require('./detalles-paciente.service');
const pacienteService = require('../paciente/paciente.service');
const { UpdateDetallesPacienteDTO } = require('./detalles-paciente.dto');

class DetallesPacienteController {

    async getDetalles(req, res) {
        try {
            const usuarioId = req.user.id;
            const paciente = await pacienteService.getByUsuarioId(usuarioId);

            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    error: 'Perfil de paciente no encontrado'
                });
            }
            const detalles = await detallesPacienteService.getByPacienteId(paciente.id);
            if (!detalles) {
                return res.json({
                    success: true,
                    data: null,
                    message: 'No hay detalles médicos registrados'
                });
            }
            res.json({
                success: true,
                data: detalles
            });
        } catch (error) {
            console.error('Error en getDetalles:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener los detalles médicos'
            });
        }
    }

    async updateDetalles(req, res) {
        try {
            const usuarioId = req.user.id;
            const paciente = await pacienteService.getByUsuarioId(usuarioId);
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    error: 'Perfil de paciente no encontrado'
                });
            }
            const updateDTO = new UpdateDetallesPacienteDTO(req.body);
            const errors = updateDTO.validate();
            if (errors) {
                return res.status(400).json({
                    success: false,
                    errors
                });
            }
            const detalles = await detallesPacienteService.update(paciente.id, updateDTO);
            res.json({
                success: true,
                data: detalles,
                message: 'Detalles médicos actualizados exitosamente'
            });
        } catch (error) {
            console.error('Error en updateDetalles:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar los detalles médicos'
            });
        }
    }
}

module.exports = new DetallesPacienteController();
