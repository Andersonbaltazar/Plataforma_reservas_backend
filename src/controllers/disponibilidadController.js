const { Client } = require('pg');
require('dotenv').config();

const getClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL
  });
};

// ✅ Agregar/Actualizar disponibilidad de una fecha
const agregarDisponibilidad = async (req, res) => {
  const client = getClient();
  try {
    const { id } = req.params;
    const { fecha, disponible } = req.body;

    // Validaciones
    if (!fecha || disponible === undefined || disponible === null) {
      return res.status(400).json({ error: 'Campos requeridos: fecha (YYYY-MM-DD), disponible (boolean)' });
    }

    // Validar formato de fecha
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) {
      return res.status(400).json({ error: 'Fecha inválida. Usar formato YYYY-MM-DD' });
    }

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

    // Verificar si ya existe una disponibilidad para esa fecha
    const existente = await client.query(
      'SELECT id FROM disponibilidades_medico WHERE medico_id = $1 AND fecha = $2',
      [id, fecha]
    );

    let resultado;
    if (existente.rows.length > 0) {
      // Actualizar
      resultado = await client.query(
        'UPDATE disponibilidades_medico SET disponible = $1 WHERE medico_id = $2 AND fecha = $3 RETURNING *',
        [disponible, id, fecha]
      );
    } else {
      // Crear nueva
      resultado = await client.query(
        'INSERT INTO disponibilidades_medico (medico_id, fecha, disponible) VALUES ($1, $2, $3) RETURNING *',
        [id, fecha, disponible]
      );
    }

    await client.end();

    res.status(201).json({
      message: 'Disponibilidad guardada',
      data: resultado.rows[0]
    });

  } catch (error) {
    console.error(error);
    await client.end();
    res.status(500).json({ error: 'Error al agregar disponibilidad' });
  }
};

// ✅ Obtener disponibilidades de un médico (por rango de fechas opcional)
const obtenerDisponibilidades = async (req, res) => {
  const client = getClient();
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin } = req.query; // Opcional: rango de fechas

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

    let query = 'SELECT * FROM disponibilidades_medico WHERE medico_id = $1';
    const params = [id];

    // Si se proporciona rango de fechas
    if (fechaInicio && fechaFin) {
      query += ' AND fecha BETWEEN $2 AND $3';
      params.push(fechaInicio, fechaFin);
    }

    query += ' ORDER BY fecha DESC';

    const disponibilidadesResult = await client.query(query, params);

    await client.end();

    // Agrupar por disponibilidad
    const disponibles = disponibilidadesResult.rows.filter(d => d.disponible);
    const noDisponibles = disponibilidadesResult.rows.filter(d => !d.disponible);

    res.json({ 
      total: disponibilidadesResult.rows.length,
      disponibles: disponibles.length,
      noDisponibles: noDisponibles.length,
      data: disponibilidadesResult.rows 
    });

  } catch (error) {
    console.error(error);
    await client.end();
    res.status(500).json({ error: 'Error al obtener disponibilidades' });
  }
};

// ✅ Eliminar disponibilidad de una fecha
const eliminarDisponibilidad = async (req, res) => {
  const client = getClient();
  try {
    const { disponibilidadId } = req.params;
    await client.connect();

    // Verificar que existe
    const disponibilidadResult = await client.query(
      'SELECT id FROM disponibilidades_medico WHERE id = $1',
      [disponibilidadId]
    );

    if (disponibilidadResult.rows.length === 0) {
      await client.end();
      return res.status(404).json({ error: 'Disponibilidad no encontrada' });
    }

    await client.query(
      'DELETE FROM disponibilidades_medico WHERE id = $1',
      [disponibilidadId]
    );

    await client.end();

    res.json({ message: 'Disponibilidad eliminada' });

  } catch (error) {
    console.error(error);
    await client.end();
    res.status(500).json({ error: 'Error al eliminar disponibilidad' });
  }
};

module.exports = {
  agregarDisponibilidad,
  obtenerDisponibilidades,
  eliminarDisponibilidad
};
