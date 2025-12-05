/**
 * Validaciones de datos
 */

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} - true si el email es válido
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Valida que la contraseña tenga al menos 6 caracteres
 * @param {string} password - Contraseña a validar
 * @returns {boolean} - true si la contraseña es válida
 */
const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') {
    return false;
  }
  return password.length >= 6;
};

module.exports = {
  isValidEmail,
  isValidPassword
};

