const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding...');

    const roles = ['PACIENTE', 'MEDICO'];

    for (const roleName of roles) {
        const role = await prisma.rol.upsert({
            where: { nombre: roleName },
            update: {},
            create: {
                nombre: roleName,
            },
        });
        console.log(`✅ Role ensured: ${role.nombre} (ID: ${role.id})`);
    }

    console.log('✅ Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
