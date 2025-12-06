const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser } = require('../models/users');
const { isValidEmail, isValidPassword } = require('../utils/validators');
const { PrismaClient } = require('@prisma/client');
const prisma = require('../config/prisma');

const register = async (req, res) => {
  try {
    const { email, password, name, apellido, telefono } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Este email ya está registrado. Intenta iniciar sesión.' });
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser({
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      name: name || email.split('@')[0],
      apellido: apellido || null,
      telefono: telefono || null
    }, 1);

    const paciente = await prisma.paciente.create({
      data: {
        usuario_id: parseInt(user.id)
      }
    });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Error de configuración del servidor' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roleId: user.roleId || 1
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.nombre,
        roleId: user.roleId || 1,
        telefono: user.telefono || null,
        apellido: user.apellido || null,
        paciente_id: paciente.id
      }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Este email ya está registrado. Intenta iniciar sesión.' });
    }

    res.status(500).json({
      error: 'Error al registrar usuario. Por favor intenta nuevamente.',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    const user = await findUserByEmail(email.trim().toLowerCase());

    if (!user || !user.password) {
      await bcrypt.compare(password, '$2b$10$dummy.hash.to.prevent.timing.attacks');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (user.activo === false) {
      return res.status(403).json({ error: 'Cuenta desactivada' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Error de configuración del servidor' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roleId: user.roleId || 1
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name || user.nombre,
      roleId: user.roleId,
      telefono: user.telefono || null,
      apellido: user.apellido || null
    };

    if (user.roleId === 2) {
      if (user.medico_id) {
        userResponse.medico_id = parseInt(user.medico_id);
      } else {
        const medico = await prisma.medico.findUnique({
          where: { usuario_id: parseInt(user.id) },
          select: { id: true }
        });
        if (medico) {
          userResponse.medico_id = medico.id;
        }
      }
    }

    if (user.roleId === 1) {
      if (user.paciente_id) {
        userResponse.paciente_id = parseInt(user.paciente_id);
      } else {
        const paciente = await prisma.paciente.findUnique({
          where: { usuario_id: parseInt(user.id) },
          select: { id: true }
        });
        if (paciente) {
          userResponse.paciente_id = paciente.id;
        }
      }
    }

    res.json({
      message: 'Login exitoso',
      token,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al iniciar sesión',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const me = async (req, res) => {
  try {
    const userResponse = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name || req.user.nombre,
      roleId: req.user.roleId,
      telefono: req.user.telefono || null,
      apellido: req.user.apellido || null
    };

    if (req.user.roleId === 2) {
      const medico = await prisma.medico.findUnique({
        where: { usuario_id: parseInt(req.user.id) },
        select: { id: true, especialidad: true }
      });

      if (medico) {
        userResponse.medico_id = medico.id;
        userResponse.especialidad = medico.especialidad;
      }
    }

    if (req.user.roleId === 1) {
      const paciente = await prisma.paciente.findUnique({
        where: { usuario_id: parseInt(req.user.id) },
        select: { id: true }
      });

      if (paciente) {
        userResponse.paciente_id = paciente.id;
      }
    }

    res.json({
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener información del usuario',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const registerMedico = async (req, res) => {
  try {
    const { email, password, name, apellido, telefono, especialidad, descripcion } = req.body;

    if (!email || !password || !especialidad) {
      return res.status(400).json({ error: 'Email, contraseña y especialidad son requeridos' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Este email ya está registrado. Intenta iniciar sesión.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser({
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      name: name || email.split('@')[0],
      apellido: apellido || null,
      telefono: telefono || null
    }, 2);

    const medico = await prisma.medico.create({
      data: {
        usuario_id: parseInt(user.id),
        especialidad: especialidad,
        descripcion: descripcion || null
      }
    });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Error de configuración del servidor' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roleId: 2
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const responseData = {
      message: 'Médico registrado exitosamente',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.nombre,
        roleId: 2,
        telefono: user.telefono || null,
        apellido: user.apellido || null,
        medico_id: medico.id,
        especialidad: medico.especialidad
      }
    };

    res.status(201).json(responseData);

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Este email ya está registrado.' });
    }

    res.status(500).json({
      error: 'Error al registrar médico',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  me,
  registerMedico
};
