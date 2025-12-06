/**
 * 🗄️ SCRIPT DE CONFIGURACIÓN DE BASE DE DATOS
 * 
 * Este script crea la estructura completa de la base de datos
 * con todas las tablas necesarias para la plataforma de reservas médicas.
 * 
 * USO:
 * node db-setup.js
 * 
 * REQUISITOS:
 * - PostgreSQL instalado y corriendo
 * - Variable DATABASE_URL en .env configurada
 * - Permiso para crear tablas en la BD
 */

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

const SQL_SCHEMA = `
-- ============================================
-- TABLA: roles
-- Descripción: Define roles de usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: usuarios
-- Descripción: Base de todos los usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  oauth_provider VARCHAR(50),
  oauth_provider_id VARCHAR(255),
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: pacientes
-- Descripción: Información extendida de pacientes
-- ============================================
CREATE TABLE IF NOT EXISTS pacientes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_nacimiento DATE,
  direccion VARCHAR(255),
  sexo VARCHAR(10)
);

-- ============================================
-- TABLA: detalles_pacientes
-- Descripción: Datos médicos adicionales del paciente
-- ============================================
CREATE TABLE IF NOT EXISTS detalles_pacientes (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL UNIQUE REFERENCES pacientes(id) ON DELETE CASCADE,
  altura_cm INTEGER,
  peso_kg INTEGER,
  alergias TEXT,
  enfermedades_previas TEXT,
  medicamentos_actuales TEXT,
  antecedentes_familiares TEXT
);

-- ============================================
-- TABLA: medicos
-- Descripción: Información de médicos
-- ============================================
CREATE TABLE IF NOT EXISTS medicos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  especialidad VARCHAR(100) NOT NULL,
  descripcion TEXT,
  foto_perfil TEXT
);

-- ============================================
-- TABLA: disponibilidades_medico
-- Descripción: Días NO DISPONIBLES del médico
-- El médico marca los días que NO puede atender
-- ============================================
CREATE TABLE IF NOT EXISTS disponibilidades_medico (
  id SERIAL PRIMARY KEY,
  medico_id INTEGER NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  disponible BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(medico_id, fecha)
);

-- Asegurar que la columna 'disponible' existe (por si la tabla ya existía)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='disponibilidades_medico' AND column_name='disponible'
  ) THEN
    ALTER TABLE disponibilidades_medico ADD COLUMN disponible BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ============================================
-- TABLA: citas
-- Descripción: Reservas entre paciente y médico
-- ============================================
CREATE TABLE IF NOT EXISTS citas (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id INTEGER NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  fecha_hora TIMESTAMP NOT NULL,
  estado VARCHAR(50) DEFAULT 'pendiente',
  motivo TEXT,
  comentario_medico TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asegurar que la columna 'fecha_hora' existe (por si había una versión antigua)
DO $$ 
BEGIN
  -- Si NO existe fecha_hora, agregarla
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='citas' AND column_name='fecha_hora'
  ) THEN
    -- Si existe 'fecha', renombrarla
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='citas' AND column_name='fecha'
    ) THEN
      ALTER TABLE citas RENAME COLUMN fecha TO fecha_hora;
    ELSE
      -- Si no existe ninguna, agregarla
      ALTER TABLE citas ADD COLUMN fecha_hora TIMESTAMP;
    END IF;
  END IF;
  
  -- Eliminar columnas antiguas si existen
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citas' AND column_name='hora_inicio') THEN
    ALTER TABLE citas DROP COLUMN hora_inicio;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='citas' AND column_name='hora_fin') THEN
    ALTER TABLE citas DROP COLUMN hora_fin;
  END IF;
END $$;

-- ============================================
-- ÍNDICES para mejor rendimiento
-- ============================================
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role_id ON usuarios(role_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_usuario_id ON pacientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_medicos_usuario_id ON medicos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_disponibilidades_medico_id ON disponibilidades_medico(medico_id);
CREATE INDEX IF NOT EXISTS idx_disponibilidades_fecha ON disponibilidades_medico(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_paciente_id ON citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_medico_id ON citas(medico_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha_hora ON citas(fecha_hora);

-- ============================================
-- INSERTAR ROLES INICIALES
-- ============================================
INSERT INTO roles (nombre) VALUES ('PACIENTE') ON CONFLICT DO NOTHING;
INSERT INTO roles (nombre) VALUES ('MEDICO') ON CONFLICT DO NOTHING;
`;

async function setupDatabase() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado');

    console.log('🗄️  Creando estructura de BD...');
    await client.query(SQL_SCHEMA);
    console.log('✅ Tablas creadas exitosamente');

    // Verificar que las tablas existen
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n📋 Tablas creadas:');
    result.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });

    console.log('\n✅ Base de datos configurada correctamente');
    console.log('🚀 Listo para usar en el backend');

  } catch (error) {
    console.error('❌ Error al configurar la BD:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Ejecutar
setupDatabase();
