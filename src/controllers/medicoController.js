const prisma = require('../config/prisma');

// ✅ Registrar un nuevo médico
const registrarMedico = async (req, res) => {
  try {
    const {
      email,
      nombre,
      apellido,
      telefono,
      especialidad,
      descripcion,
      foto_perfil
    } = req.body;

    if (!email || !nombre || !apellido || !especialidad) {
      return res.status(400).json({ error: 'Campos requeridos: email, nombre, apellido, especialidad' });
    }

    // Verificar si el email ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email }
    });

    if (usuarioExistente) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Obtener rol de MEDICO
    const rol = await prisma.rol.findUnique({
      where: { nombre: 'MEDICO' }
    });

    if (!rol) {
      return res.status(500).json({ error: 'Rol MEDICO no existe en la base de datos' });
    }

    // Crear usuario y médico en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          email,
          nombre,
          apellido,
          telefono,
          role_id: rol.id
        }
      });

      const medico = await tx.medico.create({
        data: {
          usuario_id: usuario.id,
          especialidad,
          descripcion,
          foto_perfil
        },
        include: { usuario: true }
      });

      return medico;
    });

    res.status(201).json({
      message: 'Médico registrado exitosamente',
      data: result
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar médico' });
  }
};

// ✅ Obtener todos los médicos
const obtenerMedicos = async (req, res) => {
  try {
    const medicos = await prisma.medico.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombre: true,
            apellido: true,
            telefono: true,
            fecha_creacion: true
          }
        }
      }
    });

    // Transformar para aplanar usuario en el médico
    const medicosTransformados = medicos.map(medico => ({
      id: medico.id,
      especialidad: medico.especialidad,
      descripcion: medico.descripcion,
      foto_perfil: medico.foto_perfil,
      nombre: medico.usuario.nombre,
      apellido: medico.usuario.apellido,
      telefono: medico.usuario.telefono,
      activo: true
    }));

    res.json({
      success: true,
      total: medicosTransformados.length,
      data: medicosTransformados
    });

  } catch (error) {
    console.error('Error al obtener médicos:', error);
    res.status(500).json({ success: false, error: 'Error al obtener médicos' });
  }
};

// ✅ Obtener un médico por ID
const obtenerMedicoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const medicoId = parseInt(id);

    const medico = await prisma.medico.findUnique({
      where: { id: medicoId },
      include: {
        usuario: true,
        disponibilidades: {
          where: { disponible: false },
          orderBy: { fecha: 'asc' }
        },
        citas: {
          include: {
            paciente: {
              include: { usuario: true }
            }
          },
          orderBy: { fecha_hora: 'desc' }
        }
      }
    });

    if (!medico) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    res.json({ data: medico });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener médico' });
  }
};

// ✅ Actualizar datos del médico
const actualizarMedico = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      apellido,
      telefono,
      especialidad,
      descripcion,
      foto_perfil
    } = req.body;

    const medicoId = parseInt(id);

    // Verificar que el médico existe
    const medico = await prisma.medico.findUnique({
      where: { id: medicoId }
    });

    if (!medico) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    // Actualizar en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar usuario si hay cambios
      if (nombre || apellido || telefono) {
        await tx.usuario.update({
          where: { id: medico.usuario_id },
          data: {
            ...(nombre && { nombre }),
            ...(apellido && { apellido }),
            ...(telefono && { telefono })
          }
        });
      }

      // Actualizar médico
      const medicoActualizado = await tx.medico.update({
        where: { id: medicoId },
        data: {
          ...(especialidad && { especialidad }),
          ...(descripcion !== undefined && { descripcion }),
          ...(foto_perfil !== undefined && { foto_perfil })
        },
        include: { usuario: true }
      });

      return medicoActualizado;
    });

    res.json({
      message: 'Médico actualizado exitosamente',
      data: result
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar médico' });
  }
};

// ✅ Obtener disponibilidad (Horarios libres) para una fecha
const obtenerDisponibilidad = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha } = req.query; // YYYY-MM-DD

    if (!fecha) {
      return res.status(400).json({ success: false, error: 'Fecha requerida (YYYY-MM-DD)' });
    }

    const medicoId = parseInt(id);

    // 1. Definir horario base (Lunes a Viernes, 09:00 - 18:00)
    const horaInicio = 9; // 9 AM
    const horaFin = 18;   // 6 PM

    // Generar todos los slots posibles
    const slots = [];
    for (let h = horaInicio; h < horaFin; h++) {
      slots.push({
        inicio: `${h.toString().padStart(2, '0')}:00`,
        fin: `${(h + 1).toString().padStart(2, '0')}:00`
      });
    }

    // 2. Obtener citas existentes para esa fecha y médico
    const startOfDay = new Date(`${fecha}T00:00:00`);
    const endOfDay = new Date(`${fecha}T23:59:59`);

    // 1.5 Verificar si el día está marcado como NO DISPONIBLE explícitamente
    const diaBloqueado = await prisma.disponibilidadMedico.findFirst({
      where: {
        medico_id: medicoId,
        fecha: {
          gte: startOfDay,
          lte: endOfDay
        },
        disponible: false
      }
    });

    if (diaBloqueado) {
      return res.json({
        success: true,
        data: {
          disponible: false,
          razon: 'El médico ha marcado este día como no disponible.',
          horarios: []
        }
      });
    }

    const citas = await prisma.cita.findMany({
      where: {
        medico_id: medicoId,
        fecha_hora: {
          gte: startOfDay,
          lte: endOfDay
        },
        estado: {
          not: 'cancelada' // Ignorar citas canceladas
        }
      }
    });

    // 3. Filtrar slots ocupados
    const horariosDisponibles = slots.filter(slot => {
      // Verificar si hay alguna cita que coincida con este slot
      const ocupado = citas.some(cita => {
        const citaHora = new Date(cita.fecha_hora).getHours();
        const slotHora = parseInt(slot.inicio.split(':')[0]);
        return citaHora === slotHora;
      });
      return !ocupado;
    });

    res.json({
      success: true,
      data: {
        disponible: horariosDisponibles.length > 0,
        horarios: horariosDisponibles
      }
    });

  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    res.status(500).json({ success: false, error: 'Error al obtener disponibilidad' });
  }
};

module.exports = {
  registrarMedico,
  obtenerMedicos,
  obtenerMedicoPorId,
  actualizarMedico,
  obtenerDisponibilidad
};
