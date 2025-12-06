const { Client } = require('pg');
require('dotenv').config();

const getClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL
  });
};

// ✅ Obtener citas del médico
const obtenerCitasMedico = async (req, res) => {
  const client = getClient();
  try {
    const { id } = req.params;
    await client.connect();

    // Verificar que el médico existe
    const medicoResult = await client.query(
      'SELECT id FROM medicos WHERE id = $1',
      [id]
    );

    if (medicoResult.rows.length === 0) {
      await client.end();
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    // Obtener el filtro de estado desde query params
    const { estado } = req.query;

    // Construir query con filtro opcional de estado
    let query = `
      SELECT c.*, p.id as paciente_id, u.nombre, u.apellido, u.email, u.telefono
      FROM citas c
      JOIN pacientes p ON c.paciente_id = p.id
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE c.medico_id = $1
    `;

    const params = [id];

    if (estado) {
      query += ` AND c.estado = $2`;
      params.push(estado);
    }

    query += ` ORDER BY c.fecha_hora DESC`;

    const citasResult = await client.query(query, params);

    await client.end();

    res.json({
      total: citasResult.rows.length,
      data: citasResult.rows
    });

  } catch (error) {
    console.error('❌ Error en obtenerCitasMedico:', error.message);
    console.error('Detalles del error:', error);
    try {
      await client.end();
    } catch (e) {
      // Ignorar error al cerrar conexión
    }
    res.status(500).json({
      error: 'Error al obtener citas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
