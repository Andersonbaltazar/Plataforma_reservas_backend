
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
});

process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

module.exports = prisma;
