const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function limpiarBaseDatos() {
    try {
        console.log('🗑️  Conectando a la base de datos...');
        await client.connect();
        console.log('✅ Conectado');

        console.log('\n⚠️  ADVERTENCIA: Esto eliminará TODAS las tablas y datos.');
        console.log('⏳ Esperando 3 segundos antes de comenzar...\n');

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Eliminar tablas en orden (respetando foreign keys)
        const tablas = [
            'citas',
            'disponibilidades_medico',
            'detalles_pacientes',
            'pacientes',
            'medicos',
            'usuarios',
            'roles'
        ];

        console.log('🧹 Eliminando tablas...');
        for (const tabla of tablas) {
            try {
                await client.query(`DROP TABLE IF EXISTS ${tabla} CASCADE`);
                console.log(`  ✅ Eliminada: ${tabla}`);
            } catch (error) {
                console.log(`  ⚠️  No se pudo eliminar ${tabla}: ${error.message}`);
            }
        }

        console.log('\n✅ Base de datos limpiada completamente');
        console.log('📝 Ahora puedes ejecutar: npx prisma migrate dev');

        await client.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
        process.exit(1);
    }
}

limpiarBaseDatos();
