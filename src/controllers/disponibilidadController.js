const prisma = require('../config/prisma');

// ✅ Marcar/Actualizar día NO disponible
const agregarDisponibilidad = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha } = req.body;

    // Validaciones
    if (!id || !fecha) {
      return res.status(400).json({ error: 'Campos requeridos: id (parámetro), fecha (body)' });
    }

    const medicoId = parseInt(id);
    if (isNaN(medicoId)) {
      return res.status(400).json({ error: 'ID de médico inválido' });
    }

    // Validar formato de fecha
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) {
      return res.status(400).json({ error: 'Fecha inválida. Usar formato YYYY-MM-DD' });
    }

    // Verificar que el médico existe
    const medico = await prisma.medico.findUnique({
      where: { id: medicoId }
    });

    if (!medico) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    // Verificar si ya existe una entrada para esa fecha
    const existente = await prisma.disponibilidadMedico.findFirst({
      where: {
        medico_id: medicoId,
        fecha: new Date(fecha)
      }
    });

    let resultado;
    if (existente) {
      // Actualizar
      resultado = await prisma.disponibilidadMedico.update({
        where: { id: existente.id },
        data: { no_disponible: true }
      });
    } else {
      // Crear nueva entrada (marcado como no disponible)
      resultado = await prisma.disponibilidadMedico.create({
        data: {
          medico_id: medicoId,
          fecha: new Date(fecha),
          no_disponible: true
        }
      });
    }

    res.status(201).json({
      message: 'Día marcado como NO DISPONIBLE',
      data: resultado
    });

  } catch (error) {
    console.error('Error en agregarDisponibilidad:', error);
    res.status(500).json({ 
      error: 'Error al marcar disponibilidad',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Obtener días NO disponibles de un médico
const obtenerDisponibilidades = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin } = req.query;

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

    const where = {
      medico_id: medicoId,
      no_disponible: true
    };

    // Si se proporciona rango de fechas
    if (fechaInicio && fechaFin) {
      where.fecha = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin)
      };
    }

    const noDisponibles = await prisma.disponibilidadMedico.findMany({
      where,
      orderBy: { fecha: 'asc' }
    });

    res.json({
      total_no_disponibles: noDisponibles.length,
      data: noDisponibles
    });

  } catch (error) {
    console.error('Error en obtenerDisponibilidades:', error);
    res.status(500).json({ error: 'Error al obtener disponibilidades' });
  }
};

// ✅ Eliminar día NO disponible
const eliminarDisponibilidad = async (req, res) => {
  try {
    const { id, disponibilidadId } = req.params;

    if (!disponibilidadId) {
      return res.status(400).json({ error: 'ID de disponibilidad requerido' });
    }

    const dispId = parseInt(disponibilidadId);
    if (isNaN(dispId)) {
      return res.status(400).json({ error: 'ID de disponibilidad inválido' });
    }

    // Verificar que existe
    const disponibilidad = await prisma.disponibilidadMedico.findUnique({
      where: { id: dispId }
    });

    if (!disponibilidad) {
      return res.status(404).json({ error: 'Marcación no encontrada' });
    }

    // Eliminar
    await prisma.disponibilidadMedico.delete({
      where: { id: dispId }
    });

    res.json({ message: 'Día marcado nuevamente como DISPONIBLE' });

  } catch (error) {
    console.error('Error en eliminarDisponibilidad:', error);
    res.status(500).json({ error: 'Error al eliminar marcación' });
  }
};

// ✅ Marcar múltiples días como NO disponibles (rango)
const marcarRangoNoDisponible = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin } = req.body;

    if (!id || !fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Campos requeridos: id (parámetro), fechaInicio, fechaFin (body)' });
    }

    const medicoId = parseInt(id);
    if (isNaN(medicoId)) {
      return res.status(400).json({ error: 'ID de médico inválido' });
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return res.status(400).json({ error: 'Fechas inválidas. Usar formato YYYY-MM-DD' });
    }

    if (inicio > fin) {
      return res.status(400).json({ error: 'fechaInicio debe ser menor o igual a fechaFin' });
    }

    // Verificar que el médico existe
    const medico = await prisma.medico.findUnique({
      where: { id: medicoId }
    });

    if (!medico) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    // Generar array de fechas
    const fechas = [];
    const fecha = new Date(inicio);
    while (fecha <= fin) {
      const yyyy = fecha.getFullYear();
      const mm = String(fecha.getMonth() + 1).padStart(2, '0');
      const dd = String(fecha.getDate()).padStart(2, '0');
      fechas.push(new Date(`${yyyy}-${mm}-${dd}`));
      fecha.setDate(fecha.getDate() + 1);
    }

    // Insertar/actualizar en lotes
    const resultados = [];
    for (const f of fechas) {
      const existente = await prisma.disponibilidadMedico.findFirst({
        where: {
          medico_id: medicoId,
          fecha: f
        }
      });

      let resultado;
      if (existente) {
        resultado = await prisma.disponibilidadMedico.update({
          where: { id: existente.id },
          data: { no_disponible: true }
        });
      } else {
        resultado = await prisma.disponibilidadMedico.create({
          data: {
            medico_id: medicoId,
            fecha: f,
            no_disponible: true
          }
        });
      }
      resultados.push(resultado);
    }

    res.status(201).json({
      message: `${resultados.length} días marcados como NO DISPONIBLES`,
      dias_marcados: resultados.length,
      fechaInicio,
      fechaFin,
      data: resultados
    });

  } catch (error) {
    console.error('Error en marcarRangoNoDisponible:', error);
    res.status(500).json({ error: 'Error al marcar rango de disponibilidad' });
  }
};

// ✅ Obtener calendario del mes
const obtenerCalendarioMes = async (req, res) => {
  try {
    const { id } = req.params;
    const { mes, ano } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'ID de médico requerido' });
    }

    const medicoId = parseInt(id);
    if (isNaN(medicoId)) {
      return res.status(400).json({ error: 'ID de médico inválido' });
    }

    const ahora = new Date();
    const mesActual = mes ? parseInt(mes) : ahora.getMonth() + 1;
    const anoActual = ano ? parseInt(ano) : ahora.getFullYear();

    if (mesActual < 1 || mesActual > 12) {
      return res.status(400).json({ error: 'Mes debe estar entre 1 y 12' });
    }

    // Verificar que el médico existe
    const medico = await prisma.medico.findUnique({
      where: { id: medicoId }
    });

    if (!medico) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    const fechaInicio = new Date(anoActual, mesActual - 1, 1);
    const ultimoDia = new Date(anoActual, mesActual, 0).getDate();
    const fechaFin = new Date(anoActual, mesActual - 1, ultimoDia);

    const noDisponibles = await prisma.disponibilidadMedico.findMany({
      where: {
        medico_id: medicoId,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        },
        no_disponible: true
      },
      orderBy: { fecha: 'asc' }
    });

    const diasNoDisponibles = {};
    noDisponibles.forEach(d => {
      const dia = new Date(d.fecha).getDate();
      diasNoDisponibles[dia] = {
        id: d.id,
        fecha: d.fecha
      };
    });

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
    console.error('Error en obtenerCalendarioMes:', error);
    res.status(500).json({ error: 'Error al obtener calendario' });
  }
};

// ✅ Eliminar rango de disponibilidades
const eliminarRangoNoDisponible = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin } = req.body;

    if (!id || !fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Campos requeridos: id (parámetro), fechaInicio, fechaFin (body)' });
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

    // Obtener registros a eliminar
    const registrosAEliminar = await prisma.disponibilidadMedico.findMany({
      where: {
        medico_id: medicoId,
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        }
      }
    });

    const cantidad = registrosAEliminar.length;

    // Eliminar
    await prisma.disponibilidadMedico.deleteMany({
      where: {
        medico_id: medicoId,
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        }
      }
    });

    res.json({
      message: `${cantidad} días marcados nuevamente como DISPONIBLES`,
      dias_liberados: cantidad,
      fechaInicio,
      fechaFin
    });

  } catch (error) {
    console.error('Error en eliminarRangoNoDisponible:', error);
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
