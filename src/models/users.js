const { Client } = require('pg');
require('dotenv').config();

const getClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL
  });
};

/**
 * Busca un usuario por email
 * @param {string} email - Email del usuario
 * @returns {Promise<Object|null>} - Usuario encontrado o null
 */
const findUserByEmail = async (email) => {
  const client = getClient();
  try {
    await client.connect();
    const result = await client.query(
      'SELECT u.*, r.nombre as rol_nombre FROM usuarios u JOIN roles r ON u.role_id = r.id WHERE u.email = $1',
      [email]
    );
    await client.end();
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    return {
      id: user.id.toString(),
      email: user.email,
      password: user.password_hash,
      nombre: user.nombre,
      apellido: user.apellido,
      name: `${user.nombre} ${user.apellido}`.trim(),
      roleId: user.role_id,
      rol_nombre: user.rol_nombre,
      telefono: user.telefono,
      oauthProvider: user.oauth_provider,
      oauthId: user.oauth_provider_id,
      activo: user.activo,
      createdAt: user.fecha_creacion
    };
  } catch (error) {
    console.error('Error en findUserByEmail:', error);
    await client.end();
    throw error;
  }
};

/**
 * Busca un usuario por ID
 * @param {string|number} id - ID del usuario
 * @returns {Promise<Object|null>} - Usuario encontrado o null
 */
const findUserById = async (id) => {
  const client = getClient();
  try {
    await client.connect();
    const result = await client.query(
      'SELECT u.*, r.nombre as rol_nombre FROM usuarios u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
      [id]
    );
    await client.end();
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    return {
      id: user.id.toString(),
      email: user.email,
      password: user.password_hash,
      nombre: user.nombre,
      apellido: user.apellido,
      name: `${user.nombre} ${user.apellido}`.trim(),
      roleId: user.role_id,
      rol_nombre: user.rol_nombre,
      telefono: user.telefono,
      oauthProvider: user.oauth_provider,
      oauthId: user.oauth_provider_id,
      activo: user.activo,
      createdAt: user.fecha_creacion
    };
  } catch (error) {
    console.error('Error en findUserById:', error);
    await client.end();
    throw error;
  }
};

/**
 * Crea un nuevo usuario con credenciales
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.email - Email del usuario
 * @param {string} userData.password - Hash de la contraseña
 * @param {string} userData.nombre - Nombre del usuario
 * @param {string} userData.apellido - Apellido del usuario
 * @param {number} roleId - ID del rol (default: 1 = PACIENTE)
 * @returns {Promise<Object>} - Usuario creado
 */
const createUser = async (userData, roleId = 1) => {
  const client = getClient();
  try {
    await client.connect();
    
    // Dividir name en nombre y apellido si viene como name
    let nombre = userData.nombre || '';
    let apellido = userData.apellido || '';
    
    if (userData.name && !nombre && !apellido) {
      const nameParts = userData.name.trim().split(' ');
      nombre = nameParts[0] || '';
      apellido = nameParts.slice(1).join(' ') || '';
    }
    
    // Si no hay apellido, usar el nombre como apellido
    if (nombre && !apellido) {
      apellido = nombre;
    }
    
    const result = await client.query(
      `INSERT INTO usuarios (email, password_hash, nombre, apellido, telefono, role_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, nombre, apellido, telefono, role_id, fecha_creacion`,
      [
        userData.email,
        userData.password || null,
        nombre || userData.email.split('@')[0],
        apellido || userData.email.split('@')[0],
        userData.telefono || null,
        roleId
      ]
    );
    
    await client.end();
    
    const user = result.rows[0];
    return {
      id: user.id.toString(),
      email: user.email,
      password: user.password_hash,
      nombre: user.nombre,
      apellido: user.apellido,
      name: `${user.nombre} ${user.apellido}`.trim(),
      roleId: user.role_id,
      telefono: user.telefono,
      createdAt: user.fecha_creacion
    };
  } catch (error) {
    console.error('Error en createUser:', error);
    await client.end();
    throw error;
  }
};

/**
 * Busca o crea un usuario OAuth. Si existe un usuario con el mismo email, lo vincula con OAuth.
 * @param {Object} profile - Perfil de OAuth
 * @param {string} provider - Proveedor OAuth (google, github)
 * @returns {Promise<Object>} - Usuario encontrado o creado
 */
const findOrCreateOAuthUser = async (profile, provider) => {
  const client = getClient();
  try {
    await client.connect();
    
    const email = profile.emails?.[0]?.value || `${profile.id}@${provider}.com`;
    const oauthId = profile.id?.toString() || profile.id;
    const displayName = profile.displayName || profile.username || 'Usuario';
    const nameParts = displayName.trim().split(' ');
    const nombre = nameParts[0] || 'Usuario';
    const apellido = nameParts.slice(1).join(' ') || nombre;
    const avatar = profile.photos?.[0]?.value || null;
    
    // 1. Buscar usuario existente por OAuth provider + ID
    let result = await client.query(
      'SELECT u.*, r.nombre as rol_nombre FROM usuarios u JOIN roles r ON u.role_id = r.id WHERE u.oauth_provider = $1 AND u.oauth_provider_id = $2',
      [provider, oauthId]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      await client.end();
      return {
        id: user.id.toString(),
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        name: `${user.nombre} ${user.apellido}`.trim(),
        roleId: user.role_id,
        rol_nombre: user.rol_nombre,
        oauthProvider: user.oauth_provider,
        oauthId: user.oauth_provider_id,
        activo: user.activo,
        avatar: avatar
      };
    }
    
    // 2. Buscar usuario existente por email (para unificar cuentas)
    result = await client.query(
      'SELECT u.*, r.nombre as rol_nombre FROM usuarios u JOIN roles r ON u.role_id = r.id WHERE u.email = $1',
      [email]
    );
    
    if (result.rows.length > 0) {
      // Usuario existe con email, vincular OAuth
      const user = result.rows[0];
      await client.query(
        'UPDATE usuarios SET oauth_provider = $1, oauth_provider_id = $2 WHERE id = $3',
        [provider, oauthId, user.id]
      );
      await client.end();
      
      return {
        id: user.id.toString(),
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        name: `${user.nombre} ${user.apellido}`.trim(),
        roleId: user.role_id,
        rol_nombre: user.rol_nombre,
        oauthProvider: provider,
        oauthId: oauthId,
        activo: user.activo,
        avatar: avatar
      };
    }
    
    // 3. Crear nuevo usuario OAuth (rol por defecto: PACIENTE)
    const rolResult = await client.query('SELECT id FROM roles WHERE nombre = $1', ['PACIENTE']);
    const roleId = rolResult.rows.length > 0 ? rolResult.rows[0].id : 1;
    
    result = await client.query(
      `INSERT INTO usuarios (email, nombre, apellido, oauth_provider, oauth_provider_id, role_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, nombre, apellido, role_id, fecha_creacion`,
      [email, nombre, apellido, provider, oauthId, roleId]
    );
    
    await client.end();
    
    const user = result.rows[0];
    return {
      id: user.id.toString(),
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      name: `${user.nombre} ${user.apellido}`.trim(),
      roleId: user.role_id,
      oauthProvider: provider,
      oauthId: oauthId,
      activo: true,
      avatar: avatar,
      createdAt: user.fecha_creacion
    };
  } catch (error) {
    console.error('Error en findOrCreateOAuthUser:', error);
    await client.end();
    throw error;
  }
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  findOrCreateOAuthUser
};

