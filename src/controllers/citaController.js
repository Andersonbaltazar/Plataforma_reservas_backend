const prisma = require('../config/prisma');

// ✅ Obtener citas del médico
const obtenerCitasMedico = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.query;

    const medicoId = parseInt(id);
    if (isNaN(medicoId)) {
      return res.status(400).json({ error: 'ID de médico inválido' });
    }

    // Verificar que el médico existe
    const medico = await prisma.medico.findUnique({
      where: { id: medicoId }
    });

    if (!medico) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    // Construir filtro con estado opcional
    const where = { medico_id: medicoId };
    if (estado) {
      where.estado = estado;
    }

    const citas = await prisma.cita.findMany({
      where,
      include: {
        paciente: {
          include: {
            usuario: {
              select: {
                nombre: true,
                apellido: true,
                email: true,
                telefono: true
              }
            }
          }
        }
      },
      orderBy: { fecha_hora: 'desc' }
    });

    // Aplanar datos para el frontend
    const citasMapeadas = citas.map(cita => ({
      id: cita.id,
      fecha_hora: cita.fecha_hora,
      fecha: cita.fecha,
      hora_inicio: cita.hora_inicio,
      hora_fin: cita.hora_fin,
      motivo: cita.motivo,
      estado: cita.estado,
      comentario_medico: cita.comentario_medico,
      paciente_id: cita.paciente_id,
      medico_id: cita.medico_id,
      nombre: cita.paciente?.usuario?.nombre || 'N/A',
      apellido: cita.paciente?.usuario?.apellido || '',
      email: cita.paciente?.usuario?.email || '',
      telefono: cita.paciente?.usuario?.telefono || ''
    }));

    res.json({
      total: citasMapeadas.length,
      data: citasMapeadas
    });

  } catch (error) {
    console.error('Error en obtenerCitasMedico:', error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};

// V Obtener una cita por ID
const obtenerCitaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const citaId = parseInt(id);

    const cita = await prisma.cita.findUnique({
      where: { id: citaId },
      include: {
        paciente: {
          include: { usuario: true }
        },
        medico: {
          include: { usuario: true }
        }
      }
    });

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    res.json({ data: cita });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener cita' });
  }
};

// ✅ Actualizar estado de una cita
const actualizarEstadoCita = async (req, res) => {
  try {
    // Si la ruta es /cita/:citaId, el param es citaId
    const { citaId } = req.params;
    const { estado } = req.body;

    if (!['pendiente', 'confirmada', 'cancelada', 'completada'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const id = parseInt(citaId);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de cita inválido' });
    }

    const cita = await prisma.cita.update({
      where: { id },
      data: { estado }
    });

    res.json({
      message: 'Estado actualizado',
      data: cita
    });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
};

module.exports = {
  obtenerCitasMedico,
  obtenerCitaPorId,
  actualizarEstadoCita
};
