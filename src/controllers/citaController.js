const prisma = require('../config/prisma');

// ✅ Obtener citas del médico
const obtenerCitasMedico = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID de médico requerido' });
    }

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

    const citas = await prisma.cita.findMany({
      where: { medico_id: medicoId },
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

    res.json({
      total: citas.length,
      data: citas
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};

// ✅ Actualizar estado de cita
const actualizarEstadoCita = async (req, res) => {
  const client = getClient();
  try {
    const { citaId } = req.params;
    const { estado } = req.body;

    // Validaciones
    if (!estado) {
      return res.status(400).json({ error: 'El campo estado es requerido' });
    }

    const estadosValidos = ['pendiente', 'confirmada', 'cancelada', 'completada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido. Debe ser: pendiente, confirmada, cancelada o completada' });
    }

    await client.connect();

    // Verificar que la cita existe
    const citaResult = await client.query(
      'SELECT * FROM citas WHERE id = $1',
      [citaId]
    );

    if (citaResult.rows.length === 0) {
      await client.end();
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    // Actualizar estado
    const updateResult = await client.query(
      'UPDATE citas SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, citaId]
    );

    const citaActualizada = updateResult.rows[0];

    // Obtener información del paciente
    const pacienteResult = await client.query(`
      SELECT p.id as paciente_id, u.nombre, u.apellido, u.email, u.telefono
      FROM pacientes p
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.id = $1
    `, [citaActualizada.paciente_id]);

    await client.end();

    res.json({
      message: 'Estado de cita actualizado',
      data: {
        ...citaActualizada,
        paciente: pacienteResult.rows[0]
      }
    });

  } catch (error) {
    console.error(error);
    await client.end();
    res.status(500).json({ error: 'Error al actualizar estado de cita' });
  }
};

module.exports = {
  obtenerCitasMedico,
  actualizarEstadoCita
};
