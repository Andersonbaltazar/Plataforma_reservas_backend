const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser } = require('../models/users');
const { isValidEmail, isValidPassword } = require('../utils/validators');

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
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear usuario (rol por defecto: PACIENTE = 1)
    const user = await createUser({
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      name: name || email.split('@')[0],
      apellido: apellido || null,
      telefono: telefono || null
    }, 1); // roleId = 1 = PACIENTE

    // Verificar JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no configurado en variables de entorno');
      return res.status(500).json({ error: 'Error de configuración del servidor' });
    }

    // Generar JWT con userId, email y roleId
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
        nombre: user.nombre,
        apellido: user.apellido,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error en register:', error);
    
    // Manejo específico de errores de BD
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    
    res.status(500).json({ 
      error: 'Error al registrar usuario',
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

    // Buscar usuario
    const user = await findUserByEmail(email.trim().toLowerCase());
    if (!user || !user.password) {
      // Para prevenir timing attacks, comparar hash incluso si el usuario no existe
      await bcrypt.compare(password, '$2b$10$dummy.hash.to.prevent.timing.attacks');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar si el usuario está activo
    if (user.activo === false) {
      return res.status(403).json({ error: 'Cuenta desactivada' });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no configurado en variables de entorno');
      return res.status(500).json({ error: 'Error de configuración del servidor' });
    }

    // Generar JWT con userId, email y roleId
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        roleId: user.roleId || 1
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        name: user.name,
        roleId: user.roleId,
        rol_nombre: user.rol_nombre
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      error: 'Error al iniciar sesión',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const me = async (req, res) => {
  try {
    // req.user ya viene del middleware authenticateToken
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        nombre: req.user.nombre,
        apellido: req.user.apellido,
        name: req.user.name,
        roleId: req.user.roleId,
        rol_nombre: req.user.rol_nombre,
        telefono: req.user.telefono || null,
        oauthProvider: req.user.oauthProvider || null
      }
    });
  } catch (error) {
    console.error('Error en me:', error);
    res.status(500).json({ 
      error: 'Error al obtener información del usuario',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = { register, login, me };


