const { Client } = require('pg');
require('dotenv').config();

const getClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL
  });
};

// ✅ Registrar un nuevo médico
const registrarMedico = async (req, res) => {
  const client = getClient();
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

    // Validaciones básicas
    if (!email || !nombre || !apellido || !especialidad) {
      return res.status(400).json({ error: 'Campos requeridos: email, nombre, apellido, especialidad' });
    }

    await client.connect();

    // Verificar si el email ya existe
    const usuarioExistente = await client.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (usuarioExistente.rows.length > 0) {
      await client.end();
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Obtener rol de MEDICO
    const rolResult = await client.query('SELECT id FROM roles WHERE nombre = $1', ['MEDICO']);
    if (rolResult.rows.length === 0) {
      await client.end();
      return res.status(500).json({ error: 'Rol MEDICO no existe en la base de datos' });
    }

    const roleId = rolResult.rows[0].id;

    // Crear usuario
    const usuarioResult = await client.query(
      'INSERT INTO usuarios (email, nombre, apellido, telefono, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, nombre, apellido, telefono, fecha_creacion',
      [email, nombre, apellido, telefono || null, roleId]
    );

    const usuario = usuarioResult.rows[0];

    // Crear médico
    const medicoResult = await client.query(
      'INSERT INTO medicos (usuario_id, especialidad, descripcion, foto_perfil) VALUES ($1, $2, $3, $4) RETURNING id, usuario_id, especialidad, descripcion, foto_perfil',
      [usuario.id, especialidad, descripcion || null, foto_perfil || null]
    );

    const medico = medicoResult.rows[0];

    await client.end();

    res.status(201).json({
      message: 'Médico registrado exitosamente',
      data: {
        ...medico,
        usuario
      }
    });

  } catch (error) {
    console.error(error);
    await client.end();
    res.status(500).json({ error: 'Error al registrar médico' });
  }
};

// ✅ Obtener todos los médicos
const obtenerMedicos = async (req, res) => {
  const client = getClient();
  try {
    await client.connect();

    const result = await client.query(`
      SELECT m.*, u.id as usuario_id, u.email, u.nombre, u.apellido, u.telefono, u.fecha_creacion
      FROM medicos m
      JOIN usuarios u ON m.usuario_id = u.id
    `);

    await client.end();

    res.json({
      total: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error(error);
    await client.end();
    res.status(500).json({ error: 'Error al obtener médicos' });
  }
};

// ✅ Obtener un médico por ID
const obtenerMedicoPorId = async (req, res) => {
  const client = getClient();
  try {
    const { id } = req.params;
    await client.connect();

    const medicoResult = await client.query(
      'SELECT * FROM medicos WHERE id = $1',
      [id]
    );

    if (medicoResult.rows.length === 0) {
      await client.end();
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    const medico = medicoResult.rows[0];

    const usuarioResult = await client.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [medico.usuario_id]
    );

    const disponibilidadesResult = await client.query(
      'SELECT * FROM disponibilidades_medico WHERE medico_id = $1 ORDER BY fecha ASC',
      [id]
    );

    const citasResult = await client.query(
      'SELECT c.*, p.usuario_id as paciente_usuario_id FROM citas c JOIN pacientes p ON c.paciente_id = p.id WHERE c.medico_id = $1 ORDER BY c.fecha_hora DESC',
      [id]
    );

    await client.end();

    res.json({
      data: {
        ...medico,
        usuario: usuarioResult.rows[0],
        disponibilidades: disponibilidadesResult.rows,
        citas: citasResult.rows
      }
    });

  } catch (error) {
    console.error(error);
    await client.end();
    res.status(500).json({ error: 'Error al obtener médico' });
  }
};

// ✅ Actualizar datos del médico
const actualizarMedico = async (req, res) => {
  const client = getClient();
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

    await client.connect();

    // Obtener médico
    const medicoResult = await client.query(
      'SELECT * FROM medicos WHERE id = $1',
      [id]
    );

    if (medicoResult.rows.length === 0) {
      await client.end();
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    const medico = medicoResult.rows[0];

    // Actualizar usuario si hay cambios
    if (nombre || apellido || telefono) {
      await client.query(
        'UPDATE usuarios SET nombre = COALESCE($1, nombre), apellido = COALESCE($2, apellido), telefono = COALESCE($3, telefono) WHERE id = $4',
        [nombre || null, apellido || null, telefono || null, medico.usuario_id]
      );
    }

    // Actualizar médico
    const updateResult = await client.query(
      'UPDATE medicos SET especialidad = COALESCE($1, especialidad), descripcion = COALESCE($2, descripcion), foto_perfil = COALESCE($3, foto_perfil) WHERE id = $4 RETURNING *',
      [especialidad || null, descripcion || null, foto_perfil || null, id]
    );

    const medicoActualizado = updateResult.rows[0];

    const usuarioResult = await client.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [medico.usuario_id]
    );

    await client.end();

    res.json({
      message: 'Médico actualizado exitosamente',
      data: {
        ...medicoActualizado,
        usuario: usuarioResult.rows[0]
      }
    });

  } catch (error) {
    console.error(error);
    await client.end();
    res.status(500).json({ error: 'Error al actualizar médico' });
  }
};

module.exports = {
  registrarMedico,
  obtenerMedicos,
  obtenerMedicoPorId,
  actualizarMedico
};
