
const prisma = require('../config/prisma');
const { CitaResponseDTO } = require('./cita.dto');

class CitaService {
    async create(citaData) {
        try {
            const cita = await prisma.cita.create({
                data: citaData,
                include: {
                    medico: {
                        include: {
                            usuario: {
                                select: {
                                    nombre: true,
                                    apellido: true,
                                    telefono: true
                                }
                            }
                        }
                    },
                    paciente: {
                        include: {
                            usuario: {
                                select: {
                                    nombre: true,
                                    apellido: true,
                                    telefono: true
                                }
                            }
                        }
                    }
                }
            });

            return new CitaResponseDTO(cita);
        } catch (error) {
            console.error('Error en create:', error);
            throw new Error('Error al crear la cita');
        }
    }

    async getById(id) {
        try {
            const cita = await prisma.cita.findUnique({
                where: { id },
                include: {
                    medico: {
                        include: {
                            usuario: {
                                select: {
                                    nombre: true,
                                    apellido: true,
                                    telefono: true
                                }
                            }
                        }
                    },
                    paciente: {
                        include: {
                            usuario: {
                                select: {
                                    nombre: true,
                                    apellido: true,
                                    telefono: true
                                }
                            }
                        }
                    }
                }
            });
            if (!cita) return null;
            return new CitaResponseDTO(cita);
        } catch (error) {
            console.error('Error en getById:', error);
            throw new Error('Error al obtener la cita');
        }
    }

    async verificarDisponibilidad(medicoId, fecha, horaInicio, horaFin) {
        try {
            const fechaDate = new Date(fecha);
            fechaDate.setHours(0, 0, 0, 0);
            const diaNoDisponible = await prisma.disponibilidadMedico.findFirst({
                where: {
                    medico_id: medicoId,
                    fecha: fechaDate,
                    no_disponible: true
                }
            });
            if (diaNoDisponible) {
                return {
                    disponible: false,
                    razon: diaNoDisponible.razon || 'Médico no disponible este día'
                };
            }
            const citasExistentes = await prisma.cita.findMany({
                where: {
                    medico_id: medicoId,
                    fecha: fechaDate,
                    estado: {
                        in: ['pendiente', 'aceptada']
                    }
                }
            });
            for (const cita of citasExistentes) {
                if (this.hayConflictoHorario(cita.hora_inicio, cita.hora_fin, horaInicio, horaFin)) {
                    return {
                        disponible: false,
                        razon: 'Ya existe una cita en ese horario'
                    };
                }
            }
            return { disponible: true };
        } catch (error) {
            console.error('Error en verificarDisponibilidad:', error);
            throw new Error('Error al verificar disponibilidad');
        }
    }
    hayConflictoHorario(inicio1, fin1, inicio2, fin2) {
        return inicio1 < fin2 && inicio2 < fin1;
    }

    async cancelar(citaId, pacienteId) {
        try {
            const cita = await prisma.cita.findUnique({
                where: { id: citaId }
            });
            if (!cita) {
                throw new Error('Cita no encontrada');
            }
            if (cita.paciente_id !== pacienteId) {
                throw new Error('No tienes permiso para cancelar esta cita');
            }
            if (cita.estado !== 'pendiente') {
                throw new Error('Solo se pueden cancelar citas en estado pendiente');
            }
            const citaActualizada = await prisma.cita.update({
                where: { id: citaId },
                data: { estado: 'cancelada' },
                include: {
                    medico: {
                        include: {
                            usuario: {
                                select: {
                                    nombre: true,
                                    apellido: true,
                                    telefono: true
                                }
                            }
                        }
                    }
                }
            });
            return new CitaResponseDTO(citaActualizada);
        } catch (error) {
            console.error('Error en cancelar:', error);
            throw error;
        }
    }

    async getHorariosDisponibles(medicoId, fecha) {
        try {
            const fechaDate = new Date(fecha);
            fechaDate.setHours(0, 0, 0, 0);
            const diaNoDisponible = await prisma.disponibilidadMedico.findFirst({
                where: {
                    medico_id: medicoId,
                    fecha: fechaDate,
                    no_disponible: true
                }
            });
            if (diaNoDisponible) {
                return {
                    disponible: false,
                    razon: diaNoDisponible.razon || 'Médico no disponible',
                    horarios: []
                };
            }
            const citasExistentes = await prisma.cita.findMany({
                where: {
                    medico_id: medicoId,
                    fecha: fechaDate,
                    estado: {
                        in: ['pendiente', 'aceptada']
                    }
                },
                select: {
                    hora_inicio: true,
                    hora_fin: true
                }
            });
            const horariosDisponibles = this.generarHorariosDisponibles('08:00', '18:00', citasExistentes);
            return {
                disponible: true,
                horarios: horariosDisponibles
            };
        } catch (error) {
            console.error('Error en getHorariosDisponibles:', error);
            throw new Error('Error al obtener horarios disponibles');
        }
    }

    generarHorariosDisponibles(horaInicio, horaFin, citasExistentes) {
        const slots = [];
        const [inicioHora, inicioMinuto] = horaInicio.split(':').map(Number);
        const [finHora, finMinuto] = horaFin.split(':').map(Number);
        let currentHora = inicioHora;
        let currentMinuto = inicioMinuto;
        while (currentHora < finHora || (currentHora === finHora && currentMinuto < finMinuto)) {
            const slotInicio = `${String(currentHora).padStart(2, '0')}:${String(currentMinuto).padStart(2, '0')}`;
            currentMinuto += 30;
            if (currentMinuto >= 60) {
                currentMinuto -= 60;
                currentHora += 1;
            }
            const slotFin = `${String(currentHora).padStart(2, '0')}:${String(currentMinuto).padStart(2, '0')}`;
            const ocupado = citasExistentes.some(cita =>
                this.hayConflictoHorario(cita.hora_inicio, cita.hora_fin, slotInicio, slotFin)
            );
            if (!ocupado) {
                slots.push({
                    inicio: slotInicio,
                    fin: slotFin
                });
            }
        }
        return slots;
    }
}

module.exports = new CitaService();
