
class CreatePacienteDTO {
    constructor(data) {
        this.usuario_id = data.usuario_id;
        this.fecha_nacimiento = data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null;
        this.direccion = data.direccion || null;
        this.sexo = data.sexo || null;
    }
    validate() {
        const errors = [];
        if (!this.usuario_id) {
            errors.push('usuario_id es requerido');
        }
        if (this.sexo && !['M', 'F', 'Otro'].includes(this.sexo)) {
            errors.push('sexo debe ser M, F o Otro');
        }
        return errors.length > 0 ? errors : null;
    }
}

class UpdatePacienteDTO {
    constructor(data) {
        if (data.fecha_nacimiento !== undefined) this.fecha_nacimiento = data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null;
        if (data.direccion !== undefined) this.direccion = data.direccion;
        if (data.sexo !== undefined) this.sexo = data.sexo;
    }
    validate() {
        const errors = [];
        if (this.sexo && !['M', 'F', 'Otro'].includes(this.sexo)) {
            errors.push('sexo debe ser M, F o Otro');
        }
        return errors.length > 0 ? errors : null;
    }
}

class PacienteResponseDTO {
    constructor(paciente) {
        this.id = paciente.id;
        this.usuario_id = paciente.usuario_id;
        this.fecha_nacimiento = paciente.fecha_nacimiento;
        this.direccion = paciente.direccion;
        this.sexo = paciente.sexo;
        if (paciente.usuario) {
            this.usuario = {
                id: paciente.usuario.id,
                email: paciente.usuario.email,
                nombre: paciente.usuario.nombre,
                apellido: paciente.usuario.apellido,
                telefono: paciente.usuario.telefono,
                activo: paciente.usuario.activo
            };
        }
        if (paciente.detalles) {
            this.detalles = paciente.detalles;
        }
    }
}

module.exports = {
    CreatePacienteDTO,
    UpdatePacienteDTO,
    PacienteResponseDTO
};
