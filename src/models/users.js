const prisma = require('../config/prisma');

const findUserByEmail = async (email) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { email },
      include: {
        rol: true,
        medico: true,
        paciente: true
      }
    });

    if (!user) return null;

    return {
      id: user.id.toString(),
      email: user.email,
      password: user.password_hash,
      nombre: user.nombre,
      apellido: user.apellido,
      name: `${user.nombre} ${user.apellido}`.trim(),
      roleId: user.role_id,
      rol_nombre: user.rol ? user.rol.nombre : null,
      telefono: user.telefono,
      oauthProvider: user.oauth_provider,
      oauthId: user.oauth_provider_id,
      activo: user.activo,
      createdAt: user.fecha_creacion,
      medico_id: user.medico ? user.medico.id : null,
      paciente_id: user.paciente ? user.paciente.id : null
    };
  } catch (error) {
    console.error('Error en findUserByEmail:', error);
    throw error;
  }
};

const findUserById = async (id) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: parseInt(id) },
      include: {
        rol: true
      }
    });

    if (!user) return null;

    return {
      id: user.id.toString(),
      email: user.email,
      password: user.password_hash,
      nombre: user.nombre,
      apellido: user.apellido,
      name: `${user.nombre} ${user.apellido}`.trim(),
      roleId: user.role_id,
      rol_nombre: user.rol ? user.rol.nombre : null,
      telefono: user.telefono,
      oauthProvider: user.oauth_provider,
      oauthId: user.oauth_provider_id,
      activo: user.activo,
      createdAt: user.fecha_creacion
    };
  } catch (error) {
    console.error('Error en findUserById:', error);
    throw error;
  }
};

const createUser = async (userData, roleId = 1) => {
  try {
    let nombre = userData.nombre || '';
    let apellido = userData.apellido || '';

    if (userData.name && !nombre && !apellido) {
      const nameParts = userData.name.trim().split(' ');
      nombre = nameParts[0] || '';
      apellido = nameParts.slice(1).join(' ') || '';
    }

    if (nombre && !apellido) {
      apellido = nombre;
    }

    const user = await prisma.usuario.create({
      data: {
        email: userData.email,
        password_hash: userData.password || null,
        nombre: nombre || userData.email.split('@')[0],
        apellido: apellido || userData.email.split('@')[0],
        telefono: userData.telefono || null,
        role_id: roleId,
        activo: true
      },
      include: {
        rol: true
      }
    });

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
    throw error;
  }
};

const findOrCreateOAuthUser = async (profile, provider) => {
  try {
    const email = profile.emails?.[0]?.value || `${profile.id}@${provider}.com`;
    const oauthId = profile.id?.toString() || profile.id;
    const displayName = profile.displayName || profile.username || 'Usuario';
    const nameParts = displayName.trim().split(' ');
    const nombre = nameParts[0] || 'Usuario';
    const apellido = nameParts.slice(1).join(' ') || nombre;
    const avatar = profile.photos?.[0]?.value || null;
    let user = await prisma.usuario.findFirst({
      where: {
        oauth_provider: provider,
        oauth_provider_id: oauthId
      },
      include: { rol: true }
    });

    if (user) {
      return formatUser(user, avatar, provider, oauthId);
    }

    user = await prisma.usuario.findUnique({
      where: { email },
      include: { rol: true }
    });

    if (user) {
      user = await prisma.usuario.update({
        where: { id: user.id },
        data: {
          oauth_provider: provider,
          oauth_provider_id: oauthId
        },
        include: { rol: true }
      });
      return formatUser(user, avatar, provider, oauthId);
    }

    const rolPaciente = await prisma.rol.findUnique({
      where: { nombre: 'PACIENTE' }
    });
    const roleId = rolPaciente ? rolPaciente.id : 1;

    user = await prisma.usuario.create({
      data: {
        email,
        nombre,
        apellido,
        oauth_provider: provider,
        oauth_provider_id: oauthId,
        role_id: roleId,
        activo: true
      },
      include: { rol: true }
    });

    return formatUser(user, avatar, provider, oauthId);

  } catch (error) {
    console.error('Error en findOrCreateOAuthUser:', error);
    throw error;
  }
};

const formatUser = (user, avatar, provider, oauthId) => {
  return {
    id: user.id.toString(),
    email: user.email,
    nombre: user.nombre,
    apellido: user.apellido,
    name: `${user.nombre} ${user.apellido}`.trim(),
    roleId: user.role_id,
    rol_nombre: user.rol ? user.rol.nombre : null,
    oauthProvider: user.oauth_provider || provider,
    oauthId: user.oauth_provider_id || oauthId,
    activo: user.activo,
    avatar: avatar
  };
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  findOrCreateOAuthUser
};
