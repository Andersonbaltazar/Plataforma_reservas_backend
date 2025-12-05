
const prisma = require('../config/prisma');

class MedicoService {
    async getAllAvailable(filters = {}) {
        try {
            const where = {};
            if (filters.especialidad) {
                where.especialidad = {
                    contains: filters.especialidad,
                    mode: 'insensitive'
                };
            }
            const medicos = await prisma.medico.findMany({
                where,
                include: {
                    usuario: {
                        select: {
                            nombre: true,
                            apellido: true,
                            telefono: true,
                            activo: true
                        }
                    }
                }
            });
            const medicosActivos = medicos.filter(m => m.usuario.activo);
            return medicosActivos.map(medico => ({
                id: medico.id,
                especialidad: medico.especialidad,
                descripcion: medico.descripcion,
                foto_perfil: medico.foto_perfil,
                nombre: medico.usuario.nombre,
                apellido: medico.usuario.apellido,
                telefono: medico.usuario.telefono
            }));
        } catch (error) {
            console.error('Error en getAllAvailable:', error);
            throw new Error('Error al obtener médicos disponibles');
        }
    }

    async getById(id) {
        try {
            const medico = await prisma.medico.findUnique({
                where: { id },
                include: {
                    usuario: {
                        select: {
                            nombre: true,
                            apellido: true,
                            telefono: true,
                            activo: true
                        }
                    }
                }
            });
            if (!medico) return null;
            return {
                id: medico.id,
                especialidad: medico.especialidad,
                descripcion: medico.descripcion,
                foto_perfil: medico.foto_perfil,
                nombre: medico.usuario.nombre,
                apellido: medico.usuario.apellido,
                telefono: medico.usuario.telefono,
                activo: medico.usuario.activo
            };
        } catch (error) {
            console.error('Error en getById:', error);
            throw new Error('Error al obtener el médico');
        }
    }
}

module.exports = new MedicoService();
