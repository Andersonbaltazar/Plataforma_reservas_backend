
const pacienteService = require('./paciente.service');
const { UpdatePacienteDTO } = require('./paciente.dto');

class PacienteController {
    async getProfile(req, res) {
        try {
            const usuarioId = req.user.id;

            const paciente = await pacienteService.getByUsuarioId(usuarioId);

            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    error: 'Perfil de paciente no encontrado'
                });
            }
            res.json({
                success: true,
                data: paciente
            });
        } catch (error) {
            console.error('Error en getProfile:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener el perfil'
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const usuarioId = req.user.id;
            const pacienteActual = await pacienteService.getByUsuarioId(usuarioId);
            if (!pacienteActual) {
                return res.status(404).json({
                    success: false,
                    error: 'Perfil de paciente no encontrado'
                });
            }
            const updateDTO = new UpdatePacienteDTO(req.body);
            const errors = updateDTO.validate();
            if (errors) {
                return res.status(400).json({
                    success: false,
                    errors
                });
            }
            const pacienteActualizado = await pacienteService.update(pacienteActual.id, updateDTO);
            res.json({
                success: true,
                data: pacienteActualizado,
                message: 'Perfil actualizado exitosamente'
            });
        } catch (error) {
            console.error('Error en updateProfile:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar el perfil'
            });
        }
    }

    async getCitas(req, res) {
        try {
            const usuarioId = req.user.id;
            const paciente = await pacienteService.getByUsuarioId(usuarioId);
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    error: 'Perfil de paciente no encontrado'
                });
            }
            const filters = {
                estado: req.query.estado,
                desde: req.query.desde,
                hasta: req.query.hasta
            };
            const citas = await pacienteService.getCitas(paciente.id, filters);
            res.json({
                success: true,
                data: citas,
                count: citas.length
            });
        } catch (error) {
            console.error('Error en getCitas:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener las citas'
            });
        }
    }
}

module.exports = new PacienteController();
