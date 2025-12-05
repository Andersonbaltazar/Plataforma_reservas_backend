
const prisma = require('../config/prisma');
const { PacienteResponseDTO } = require('./paciente.dto');

class PacienteService {
    async getByUsuarioId(usuarioId) {
        try {
            const paciente = await prisma.paciente.findUnique({
                where: { usuario_id: usuarioId },
                include: {
                    usuario: {
                        select: {
                            id: true,
                            email: true,
                            nombre: true,
                            apellido: true,
                            telefono: true,
                            activo: true
                        }
                    },
                    detalles: true
                }
            });
            if (!paciente) {
                return null;
            }
            return new PacienteResponseDTO(paciente);
        } catch (error) {
            console.error('Error en getByUsuarioId:', error);
            throw new Error('Error al obtener el perfil del paciente');
        }
    }

    async getById(id) {
        try {
            const paciente = await prisma.paciente.findUnique({
                where: { id },
                include: {
                    usuario: {
                        select: {
                            id: true,
                            email: true,
                            nombre: true,
                            apellido: true,
                            telefono: true,
                            activo: true
                        }
                    },
                    detalles: true
                }
            });
            if (!paciente) {
                return null;
            }
            return new PacienteResponseDTO(paciente);
        } catch (error) {
            console.error('Error en getById:', error);
            throw new Error('Error al obtener el paciente');
        }
    }

    async create(pacienteData) {
        try {
            const paciente = await prisma.paciente.create({
                data: pacienteData,
                include: {
                    usuario: {
                        select: {
                            id: true,
                            email: true,
                            nombre: true,
                            apellido: true,
                            telefono: true,
                            activo: true
                        }
                    }
                }
            });
            return new PacienteResponseDTO(paciente);
        } catch (error) {
            console.error('Error en create:', error);
            throw new Error('Error al crear el perfil del paciente');
        }
    }

    async update(id, updateData) {
        try {
            const paciente = await prisma.paciente.update({
                where: { id },
                data: updateData,
                include: {
                    usuario: {
                        select: {
                            id: true,
                            email: true,
                            nombre: true,
                            apellido: true,
                            telefono: true,
                            activo: true
                        }
                    },
                    detalles: true
                }
            });
            return new PacienteResponseDTO(paciente);
        } catch (error) {
            console.error('Error en update:', error);
            throw new Error('Error al actualizar el perfil del paciente');
        }
    }

    async getCitas(pacienteId, filters = {}) {
        try {
            const where = { paciente_id: pacienteId };
            if (filters.estado) {
                where.estado = filters.estado;
            }
            if (filters.desde || filters.hasta) {
                where.fecha = {};
                if (filters.desde) where.fecha.gte = new Date(filters.desde);
                if (filters.hasta) where.fecha.lte = new Date(filters.hasta);
            }
            const citas = await prisma.cita.findMany({
                where,
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
                },
                orderBy: {
                    fecha: 'desc'
                }
            });
            return citas;
        } catch (error) {
            console.error('Error en getCitas:', error);
            throw new Error('Error al obtener las citas del paciente');
        }
    }
}

module.exports = new PacienteService();
