
class CreateCitaDTO {
    constructor(data) {
        this.paciente_id = data.paciente_id;
        this.medico_id = data.medico_id;
        this.fecha = new Date(data.fecha);
        this.hora_inicio = data.hora_inicio;
        this.hora_fin = data.hora_fin;
        this.motivo = data.motivo || null;
        this.estado = 'pendiente';
    }

    validate() {
        const errors = [];

        if (!this.paciente_id) {
            errors.push('paciente_id es requerido');
        }

        if (!this.medico_id) {
            errors.push('medico_id es requerido');
        }

        if (!this.fecha || isNaN(this.fecha.getTime())) {
            errors.push('fecha es requerida y debe ser válida');
        }

        if (!this.hora_inicio) {
            errors.push('hora_inicio es requerida');
        }

        if (!this.hora_fin) {
            errors.push('hora_fin es requerida');
        }

        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (this.hora_inicio && !timeRegex.test(this.hora_inicio)) {
            errors.push('hora_inicio debe tener formato HH:mm (ejemplo: 09:00)');
        }

        if (this.hora_fin && !timeRegex.test(this.hora_fin)) {
            errors.push('hora_fin debe tener formato HH:mm (ejemplo: 10:00)');
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (this.fecha < hoy) {
            errors.push('No se pueden reservar citas en fechas pasadas');
        }

        return errors.length > 0 ? errors : null;
    }
}

class UpdateCitaDTO {
    constructor(data) {
        if (data.fecha !== undefined) this.fecha = new Date(data.fecha);
        if (data.hora_inicio !== undefined) this.hora_inicio = data.hora_inicio;
        if (data.hora_fin !== undefined) this.hora_fin = data.hora_fin;
        if (data.motivo !== undefined) this.motivo = data.motivo;
        if (data.estado !== undefined) this.estado = data.estado;
        if (data.comentario_medico !== undefined) this.comentario_medico = data.comentario_medico;
    }

    validate() {
        const errors = [];
        const estadosValidos = ['pendiente', 'aceptada', 'rechazada', 'cancelada'];
        if (this.estado && !estadosValidos.includes(this.estado)) {
            errors.push(`estado debe ser uno de: ${estadosValidos.join(', ')}`);
        }
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (this.hora_inicio && !timeRegex.test(this.hora_inicio)) {
            errors.push('hora_inicio debe tener formato HH:mm');
        }
        if (this.hora_fin && !timeRegex.test(this.hora_fin)) {
            errors.push('hora_fin debe tener formato HH:mm');
        }
        return errors.length > 0 ? errors : null;
    }
}

class CitaResponseDTO {
    constructor(cita) {
        this.id = cita.id;
        this.paciente_id = cita.paciente_id;
        this.medico_id = cita.medico_id;
        this.fecha = cita.fecha;
        this.hora_inicio = cita.hora_inicio;
        this.hora_fin = cita.hora_fin;
        this.estado = cita.estado;
        this.motivo = cita.motivo;
        this.comentario_medico = cita.comentario_medico;
        this.fecha_creacion = cita.fecha_creacion;

        if (cita.medico) {
            this.medico = {
                id: cita.medico.id,
                especialidad: cita.medico.especialidad,
                descripcion: cita.medico.descripcion,
                foto_perfil: cita.medico.foto_perfil
            };
            if (cita.medico.usuario) {
                this.medico.nombre = cita.medico.usuario.nombre;
                this.medico.apellido = cita.medico.usuario.apellido;
                this.medico.telefono = cita.medico.usuario.telefono;
            }
        }

        if (cita.paciente && cita.paciente.usuario) {
            this.paciente = {
                id: cita.paciente.id,
                nombre: cita.paciente.usuario.nombre,
                apellido: cita.paciente.usuario.apellido,
                telefono: cita.paciente.usuario.telefono
            };
        }
    }
}

module.exports = {
    CreateCitaDTO,
    UpdateCitaDTO,
    CitaResponseDTO
};
