const { Client } = require('pg');
require('dotenv').config();

const getClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL
  });
};

// ✅ Marcar/Actualizar día NO disponible
const agregarDisponibilidad = async (req, res) => {
  const client = getClient();
  try {
    const { id } = req.params;
    const { fecha, razon } = req.body;

    // Validaciones
    if (!fecha) {
      return res.status(400).json({ error: 'Campos requeridos: fecha (YYYY-MM-DD)' });
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

    // Verificar si ya existe una entrada para esa fecha
    const existente = await client.query(
      'SELECT id FROM disponibilidades_medico WHERE medico_id = $1 AND fecha = $2',
      [id, fecha]
    );

    let resultado;
    if (existente.rows.length > 0) {
      // Actualizar
      resultado = await client.query(
        'UPDATE disponibilidades_medico SET disponible = false WHERE medico_id = $1 AND fecha = $2 RETURNING *',
        [id, fecha]
      );
    } else {
      // Crear nueva entrada (marcado como no disponible)
      resultado = await client.query(
        'INSERT INTO disponibilidades_medico (medico_id, fecha, disponible) VALUES ($1, $2, false) RETURNING *',
        [id, fecha]
      );
    }

    await client.end();

    res.status(201).json({
      message: 'Día marcado como NO DISPONIBLE',
      data: resultado.rows[0]
    });

  } catch (error) {
    console.error(error);
    await client.end();
    res.status(500).json({ error: 'Error al marcar disponibilidad' });
  }
};

// ✅ Obtener días NO disponibles de un médico (por rango de fechas opcional)
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

    let query = 'SELECT * FROM disponibilidades_medico WHERE medico_id = $1 AND disponible = false';
    const params = [id];

    // Si se proporciona rango de fechas
    if (fechaInicio && fechaFin) {
      query += ' AND fecha BETWEEN $2 AND $3';
      params.push(fechaInicio, fechaFin);
    }

    query += ' ORDER BY fecha ASC';

    const noDisponiblesResult = await client.query(query, params);

    await client.end();

    res.json({
      total_no_disponibles: noDisponiblesResult.rows.length,
      por_razon: {},
      data: noDisponiblesResult.rows
    });

  } catch (error) {
    console.error(error);
    await client.end();
    res.status(500).json({ error: 'Error al obtener disponibilidades' });
  }
};

// ✅ Eliminar día NO disponible (marcar como disponible nuevamente)
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
      return res.status(404).json({ error: 'Marcación no encontrada' });
    }

    await client.query(
      'DELETE FROM disponibilidades_medico WHERE id = $1',
      [disponibilidadId]
    );

    await client.end();

    res.json({ message: 'Día marcado nuevamente como DISPONIBLE' });

  } catch (error) {
    console.error(error);
    await client.end();
    res.status(500).json({ error: 'Error al eliminar marcación' });
  }
};

// ✅ Marcar múltiples días como NO disponibles (rango de fechas)
const marcarRangoNoDisponible = async (req, res) => {
  const client = getClient();
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin } = req.body;

    // Validaciones
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Campos requeridos: fechaInicio, fechaFin (YYYY-MM-DD)' });
    }

    // Validar formatos
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return res.status(400).json({ error: 'Fechas inválidas. Usar formato YYYY-MM-DD' });
    }

    if (inicio > fin) {
      return res.status(400).json({ error: 'fechaInicio debe ser menor o igual a fechaFin' });
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

    // Generar array de fechas
    const fechas = [];
    const fecha = new Date(inicio);
    while (fecha <= fin) {
      const yyyy = fecha.getFullYear();
      const mm = String(fecha.getMonth() + 1).padStart(2, '0');
      const dd = String(fecha.getDate()).padStart(2, '0');
      fechas.push(`${yyyy}-${mm}-${dd}`);
      fecha.setDate(fecha.getDate() + 1);
    }

    // Insertar/actualizar en lotes
    const resultados = [];
    for (const f of fechas) {
      const existente = await client.query(
        'SELECT id FROM disponibilidades_medico WHERE medico_id = $1 AND fecha = $2',
        [id, f]
      );

      let resultado;
      if (existente.rows.length > 0) {
        resultado = await client.query(
          'UPDATE disponibilidades_medico SET disponible = false WHERE medico_id = $1 AND fecha = $2 RETURNING *',
          [id, f]
        );
      } else {
        resultado = await client.query(
          'INSERT INTO disponibilidades_medico (medico_id, fecha, disponible) VALUES ($1, $2, false) RETURNING *',
          [id, f]
        );
      }
      resultados.push(resultado.rows[0]);
    }

    await client.end();

    res.status(201).json({
      message: `${resultados.length} días marcados como NO DISPONIBLES`,
      dias_marcados: resultados.length,
      fechaInicio,
      fechaFin,
      data: resultados
    });

  } catch (error) {
    console.error(error);
    await client.end();
    res.status(500).json({ error: 'Error al marcar rango de disponibilidad' });
  }
};

// ✅ Obtener calendario del mes (disponibles vs no disponibles)
const obtenerCalendarioMes = async (req, res) => {
  const client = getClient();
  try {
    const { id } = req.params;
    const { mes, ano } = req.query; // mes: 1-12, ano: YYYY

    // Valores por defecto (mes actual)
    const ahora = new Date();
    const mesActual = mes ? parseInt(mes) : ahora.getMonth() + 1;
    const anoActual = ano ? parseInt(ano) : ahora.getFullYear();

    if (mesActual < 1 || mesActual > 12) {
      return res.status(400).json({ error: 'Mes debe estar entre 1 y 12' });
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

    // Obtener todos los días no disponibles del mes
    const fechaInicio = `${anoActual}-${String(mesActual).padStart(2, '0')}-01`;
    const ultimoDia = new Date(anoActual, mesActual, 0).getDate();
    const fechaFin = `${anoActual}-${String(mesActual).padStart(2, '0')}-${ultimoDia}`;

    const noDisponiblesResult = await client.query(
      'SELECT * FROM disponibilidades_medico WHERE medico_id = $1 AND fecha BETWEEN $2 AND $3 AND disponible = false ORDER BY fecha ASC',
      [id, fechaInicio, fechaFin]
    );

    await client.end();

    // Construir mapa de días
    const diasNoDisponibles = {};
    noDisponiblesResult.rows.forEach(d => {
      const dia = new Date(d.fecha).getDate();
      diasNoDisponibles[dia] = {
        id: d.id,
        fecha: d.fecha
      };
    });

    // Construir calendario
    const calendario = {};
    for (let dia = 1; dia <= ultimoDia; dia++) {
      const fecha = new Date(anoActual, mesActual - 1, dia);
      const yyyy = fecha.getFullYear();
      const mm = String(fecha.getMonth() + 1).padStart(2, '0');
      const dd = String(fecha.getDate()).padStart(2, '0');
      const fechaStr = `${yyyy}-${mm}-${dd}`;

      calendario[dia] = {
        fecha: fechaStr,
        diaSemana: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][fecha.getDay()],
        disponible: !diasNoDisponibles[dia],
        detalleId: diasNoDisponibles[dia]?.id || null
      };
    }

    res.json({
      mes: mesActual,
      ano: anoActual,
      dias_no_disponibles_total: Object.keys(diasNoDisponibles).length,
      dias_disponibles_total: ultimoDia - Object.keys(diasNoDisponibles).length,
      dias_total: ultimoDia,
      calendario
    });

  } catch (error) {
    console.error(error);
    await client.end();
    res.status(500).json({ error: 'Error al obtener calendario' });
  }
};

// ✅ Eliminar todas las marcaciones de un rango (dejar disponible todo el rango)
const eliminarRangoNoDisponible = async (req, res) => {
  const client = getClient();
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin } = req.body;

    // Validaciones
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Campos requeridos: fechaInicio, fechaFin (YYYY-MM-DD)' });
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

    // Obtener registros a eliminar
    const registrosAEliminar = await client.query(
      'SELECT id FROM disponibilidades_medico WHERE medico_id = $1 AND fecha BETWEEN $2 AND $3',
      [id, fechaInicio, fechaFin]
    );

    const cantidad = registrosAEliminar.rows.length;

    // Eliminar
    await client.query(
      'DELETE FROM disponibilidades_medico WHERE medico_id = $1 AND fecha BETWEEN $2 AND $3',
      [id, fechaInicio, fechaFin]
    );

    await client.end();

    res.json({
      message: `${cantidad} días marcados nuevamente como DISPONIBLES`,
      dias_liberados: cantidad,
      fechaInicio,
      fechaFin
    });

  } catch (error) {
    console.error(error);
    await client.end();
    res.status(500).json({ error: 'Error al eliminar rango de marcaciones' });
  }
};

module.exports = {
  agregarDisponibilidad,
  obtenerDisponibilidades,
  eliminarDisponibilidad,
  marcarRangoNoDisponible,
  obtenerCalendarioMes,
  eliminarRangoNoDisponible
};
