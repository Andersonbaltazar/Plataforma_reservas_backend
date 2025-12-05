
const citaService = require('./cita.service');
const pacienteService = require('../paciente/paciente.service');
const { CreateCitaDTO } = require('./cita.dto');

class CitaController {

    async create(req, res) {
        try {
            const usuarioId = req.user.id;
            const paciente = await pacienteService.getByUsuarioId(usuarioId);
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    error: 'Perfil de paciente no encontrado'
                });
            }
            const citaDTO = new CreateCitaDTO({
                ...req.body,
                paciente_id: paciente.id
            });
            const errors = citaDTO.validate();
            if (errors) {
                return res.status(400).json({
                    success: false,
                    errors
                });
            }
            const disponibilidad = await citaService.verificarDisponibilidad(
                citaDTO.medico_id,
                citaDTO.fecha,
                citaDTO.hora_inicio,
                citaDTO.hora_fin
            );
            if (!disponibilidad.disponible) {
                return res.status(409).json({
                    success: false,
                    error: disponibilidad.razon
                });
            }
            const cita = await citaService.create(citaDTO);
            res.status(201).json({
                success: true,
                data: cita,
                message: 'Cita creada exitosamente'
            });
        } catch (error) {
            console.error('Error en create:', error);
            res.status(500).json({
                success: false,
                error: 'Error al crear la cita'
            });
        }
    }

    async getById(req, res) {
        try {
            const citaId = parseInt(req.params.id);
            const usuarioId = req.user.id;

            const cita = await citaService.getById(citaId);

            if (!cita) {
                return res.status(404).json({
                    success: false,
                    error: 'Cita no encontrada'
                });
            }

            // Verificar que el paciente tenga acceso a esta cita
            const paciente = await pacienteService.getByUsuarioId(usuarioId);
            if (!paciente || cita.paciente_id !== paciente.id) {
                return res.status(403).json({
                    success: false,
                    error: 'No tienes permiso para ver esta cita'
                });
            }
            res.json({
                success: true,
                data: cita
            });
        } catch (error) {
            console.error('Error en getById:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener la cita'
            });
        }
    }

    async cancelar(req, res) {
        try {
            const citaId = parseInt(req.params.id);
            const usuarioId = req.user.id;

            const paciente = await pacienteService.getByUsuarioId(usuarioId);

            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    error: 'Perfil de paciente no encontrado'
                });
            }
            const citaCancelada = await citaService.cancelar(citaId, paciente.id);
            res.json({
                success: true,
                data: citaCancelada,
                message: 'Cita cancelada exitosamente'
            });
        } catch (error) {
            console.error('Error en cancelar:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getDisponibilidad(req, res) {
        try {
            const medicoId = parseInt(req.params.medicoId);
            const { fecha } = req.query;
            if (!fecha) {
                return res.status(400).json({
                    success: false,
                    error: 'El parámetro fecha es requerido (formato: YYYY-MM-DD)'
                });
            }
            const disponibilidad = await citaService.getHorariosDisponibles(medicoId, fecha);
            res.json({
                success: true,
                data: disponibilidad
            });
        } catch (error) {
            console.error('Error en getDisponibilidad:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener disponibilidad'
            });
        }
    }
}

module.exports = new CitaController();
