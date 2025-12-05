
const prisma = require('../config/prisma');

class DetallesPacienteService {
    async getByPacienteId(pacienteId) {
        try {
            const detalles = await prisma.detallesPaciente.findUnique({
                where: { paciente_id: pacienteId }
            });

            return detalles;
        } catch (error) {
            console.error('Error en getByPacienteId:', error);
            throw new Error('Error al obtener los detalles del paciente');
        }
    }

    async create(detallesData) {
        try {
            const detalles = await prisma.detallesPaciente.create({
                data: detallesData
            });
            return detalles;
        } catch (error) {
            console.error('Error en create:', error);
            throw new Error('Error al crear los detalles del paciente');
        }
    }

    async update(pacienteId, updateData) {
        try {
            const detalles = await prisma.detallesPaciente.upsert({
                where: { paciente_id: pacienteId },
                update: updateData,
                create: {
                    paciente_id: pacienteId,
                    ...updateData
                }
            });
            return detalles;
        } catch (error) {
            console.error('Error en update:', error);
            throw new Error('Error al actualizar los detalles del paciente');
        }
    }

    async delete(pacienteId) {
        try {
            await prisma.detallesPaciente.delete({
                where: { paciente_id: pacienteId }
            });
            return { success: true };
        } catch (error) {
            console.error('Error en delete:', error);
            throw new Error('Error al eliminar los detalles del paciente');
        }
    }
}

module.exports = new DetallesPacienteService();
