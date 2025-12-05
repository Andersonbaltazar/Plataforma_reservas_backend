// Middleware temporal para testing sin autenticación real
// Este middleware simula un usuario autenticado para permitir el desarrollo
// sin necesidad de implementar el sistema de autenticación completo

const mockUserMiddleware = (req, res, next) => {
    // Simular un usuario autenticado con datos de prueba
    // Puedes cambiar estos valores según tus necesidades de testing
    req.user = {
        id: 1, // ID del usuario en la tabla usuarios
        email: 'test@example.com',
        roleId: 1 // 1 = Paciente, 2 = Médico, 3 = Admin
    };

    next();
};

module.exports = { mockUserMiddleware };
