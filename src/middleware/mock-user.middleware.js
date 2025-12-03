
const mockUserMiddleware = (req, res, next) => {
    req.user = {
        id: 1,
        email: 'paciente@test.com',
        roleId: 1
    };
    next();
};

module.exports = { mockUserMiddleware };
