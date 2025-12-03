/**
 * DTO para DetallesPaciente
 * Información médica del paciente
 */

class CreateDetallesPacienteDTO {
    constructor(data) {
        this.paciente_id = data.paciente_id;
        this.altura_cm = data.altura_cm || null;
        this.peso_kg = data.peso_kg || null;
        this.alergias = data.alergias || null;
        this.enfermedades_previas = data.enfermedades_previas || null;
        this.medicamentos_actuales = data.medicamentos_actuales || null;
        this.antecedentes_familiares = data.antecedentes_familiares || null;
    }

    validate() {
        const errors = [];

        if (!this.paciente_id) {
            errors.push('paciente_id es requerido');
        }

        if (this.altura_cm && (this.altura_cm < 50 || this.altura_cm > 300)) {
            errors.push('altura_cm debe estar entre 50 y 300 cm');
        }

        if (this.peso_kg && (this.peso_kg < 10 || this.peso_kg > 500)) {
            errors.push('peso_kg debe estar entre 10 y 500 kg');
        }

        return errors.length > 0 ? errors : null;
    }
}

class UpdateDetallesPacienteDTO {
    constructor(data) {
        if (data.altura_cm !== undefined) this.altura_cm = data.altura_cm;
        if (data.peso_kg !== undefined) this.peso_kg = data.peso_kg;
        if (data.alergias !== undefined) this.alergias = data.alergias;
        if (data.enfermedades_previas !== undefined) this.enfermedades_previas = data.enfermedades_previas;
        if (data.medicamentos_actuales !== undefined) this.medicamentos_actuales = data.medicamentos_actuales;
        if (data.antecedentes_familiares !== undefined) this.antecedentes_familiares = data.antecedentes_familiares;
    }

    validate() {
        const errors = [];

        if (this.altura_cm && (this.altura_cm < 50 || this.altura_cm > 300)) {
            errors.push('altura_cm debe estar entre 50 y 300 cm');
        }

        if (this.peso_kg && (this.peso_kg < 10 || this.peso_kg > 500)) {
            errors.push('peso_kg debe estar entre 10 y 500 kg');
        }

        return errors.length > 0 ? errors : null;
    }
}

module.exports = {
    CreateDetallesPacienteDTO,
    UpdateDetallesPacienteDTO
};
