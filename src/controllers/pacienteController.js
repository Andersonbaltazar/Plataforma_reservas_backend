const prisma = require('../config/prisma');

const obtenerCitasPaciente = async (req, res) => {
    try {
        let paciente_id = req.params.id;

        if (!paciente_id && req.user && req.user.paciente_id) {
            paciente_id = req.user.paciente_id;
        }

        if (!paciente_id) {
            return res.status(400).json({
                success: false,
                error: 'No se pudo identificar al paciente'
            });
        }

        const paciente = await prisma.paciente.findUnique({
            where: { id: parseInt(paciente_id) }
        });

        if (!paciente) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }

        const { estado } = req.query;

        const whereClause = {
            paciente_id: parseInt(paciente_id)
        };

        if (estado) {
            whereClause.estado = estado;
        }

        const citas = await prisma.cita.findMany({
            where: whereClause,
            include: {
                medico: {
                    include: {
                        usuario: {
                            select: {
                                nombre: true,
                                apellido: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                fecha_hora: 'desc'
            }
        });

        res.json({
            success: true,
            total: citas.length,
            data: citas
        });

    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener citas'
        });
    }
};

const crearCita = async (req, res) => {
    try {
        const { paciente_id, medico_id, fecha_hora, motivo } = req.body;

        if (!paciente_id || !medico_id || !fecha_hora) {
            return res.status(400).json({
                success: false,
                error: 'Campos requeridos: paciente_id, medico_id, fecha_hora'
            });
        }

        const paciente = await prisma.paciente.findUnique({
            where: { id: parseInt(paciente_id) }
        });

        if (!paciente) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }

        const medico = await prisma.medico.findUnique({
            where: { id: parseInt(medico_id) }
        });

        if (!medico) {
            return res.status(404).json({
                success: false,
                error: 'Médico no encontrado'
            });
        }

        const cita = await prisma.cita.create({
            data: {
                paciente_id: parseInt(paciente_id),
                medico_id: parseInt(medico_id),
                fecha_hora: new Date(fecha_hora),
                motivo: motivo || null,
                estado: 'pendiente'
            }
        });

        res.status(201).json({
            success: true,
            message: 'Cita creada exitosamente',
            data: cita
        });

    } catch (error) {
        console.error('Error al crear cita:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear cita'
        });
    }
};

const actualizarCita = async (req, res) => {
    try {
        const citaId = parseInt(req.params.id);
        const { motivo } = req.body;

        const cita = await prisma.cita.findUnique({
            where: { id: citaId }
        });

        if (!cita) {
            return res.status(404).json({ success: false, error: 'Cita no encontrada' });
        }

        if (cita.estado !== 'pendiente') {
            return res.status(400).json({ success: false, error: 'Solo se pueden editar citas pendientes' });
        }

        const citaActualizada = await prisma.cita.update({
            where: { id: citaId },
            data: {
                motivo: motivo || cita.motivo
            }
        });

        res.json({
            success: true,
            data: citaActualizada,
            message: 'Cita actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar cita:', error);
        res.status(500).json({ success: false, error: 'Error al actualizar cita' });
    }
};

module.exports = {
    obtenerCitasPaciente,
    crearCita,
    actualizarCita
};
