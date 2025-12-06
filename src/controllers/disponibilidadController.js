const prisma = require('../config/prisma');

// ✅ Marcar día como NO disponible
const agregarDisponibilidad = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha } = req.body;

    if (!fecha) {
      return res.status(400).json({ error: 'Campo requerido: fecha (YYYY-MM-DD)' });
    }

    const medicoId = parseInt(id);

    // Verificar que el médico existe
    const medico = await prisma.medico.findUnique({
      where: { id: medicoId }
    });

    if (!medico) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    // Upsert: crear o actualizar
    const disponibilidad = await prisma.disponibilidadMedico.upsert({
      where: {
        medico_id_fecha: {
          medico_id: medicoId,
          fecha: new Date(fecha)
        }
      },
      update: {
        disponible: false
      },
      create: {
        medico_id: medicoId,
        fecha: new Date(fecha),
        disponible: false
      }
    });

    res.status(201).json({
      message: 'Día marcado como NO DISPONIBLE',
      data: disponibilidad
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al marcar disponibilidad' });
  }
};

// ✅ Obtener días NO disponibles de un médico
const obtenerDisponibilidades = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin } = req.query;
    const medicoId = parseInt(id);

    // Verificar que el médico existe
    const medico = await prisma.medico.findUnique({
      where: { id: medicoId }
    });

    if (!medico) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    // Construir filtro
    const where = {
      medico_id: medicoId,
      disponible: false
    };

    if (fechaInicio && fechaFin) {
      where.fecha = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin)
      };
    }

    const disponibilidades = await prisma.disponibilidadMedico.findMany({
      where,
      orderBy: { fecha: 'asc' }
    });

    res.json({
      total: disponibilidades.length,
      data: disponibilidades
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener disponibilidades' });
  }
};

// ✅ Eliminar disponibilidad (marcar día como DISPONIBLE de nuevo)
const eliminarDisponibilidad = async (req, res) => {
  try {
    const { disponibilidadId } = req.params;
    const id = parseInt(disponibilidadId);

    await prisma.disponibilidadMedico.delete({
      where: { id }
    });

    res.json({ message: 'Día marcado como DISPONIBLE nuevamente' });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Disponibilidad no encontrada' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar disponibilidad' });
  }
};

// ✅ Obtener calendario mensual
const obtenerCalendario = async (req, res) => {
  try {
    const { id } = req.params;
    let { mes, ano } = req.query;

    const medicoId = parseInt(id);
    mes = parseInt(mes) || (new Date().getMonth() + 1);
    ano = parseInt(ano) || new Date().getFullYear();

    // Verificar médico
    const medico = await prisma.medico.findUnique({
      where: { id: medicoId }
    });

    if (!medico) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    const primerDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);

    // Obtener días NO disponibles del mes
    const disponibilidades = await prisma.disponibilidadMedico.findMany({
      where: {
        medico_id: medicoId,
        disponible: false,
        fecha: {
          gte: primerDia,
          lte: ultimoDia
        }
      }
    });

    // Construir calendario
    const calendario = {};
    const diasMes = ultimoDia.getDate();

    for (let dia = 1; dia <= diasMes; dia++) {
      const fecha = new Date(ano, mes - 1, dia);
      const fechaStr = fecha.toISOString().split('T')[0];
      const disponibilidad = disponibilidades.find(
        d => d.fecha.toISOString().split('T')[0] === fechaStr
      );

      calendario[fechaStr] = {
        fecha: fechaStr,
        diaSemana: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][fecha.getDay()],
        disponible: !disponibilidad,
        detalleId: disponibilidad?.id || null
      };
    }

    res.json({
      mes,
      ano,
      dias_no_disponibles_total: disponibilidades.length,
      dias_disponibles_total: diasMes - disponibilidades.length,
      dias_total: diasMes,
      calendario
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener calendario' });
  }
};

module.exports = {
  agregarDisponibilidad,
  obtenerDisponibilidades,
  eliminarDisponibilidad,
  obtenerCalendario
};
