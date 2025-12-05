const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function fixRoles() {
    try {
        console.log('🔄 Connecting to database...');
        await client.connect();
        console.log('✅ Connected');

        const roles = ['PACIENTE', 'MEDICO'];

        console.log('\n🛠️  Checking and repairing roles...');

        for (const roleName of roles) {
            // Try to find if role exists
            let res = await client.query('SELECT * FROM roles WHERE nombre = $1', [roleName]);

            if (res.rows.length === 0) {
                // Insert if not exists
                console.log(`⚠️  Role '${roleName}' missing. Creating...`);
                res = await client.query(
                    'INSERT INTO roles (nombre) VALUES ($1) RETURNING *',
                    [roleName]
                );
                console.log(`✅ Role '${roleName}' created with ID: ${res.rows[0].id}`);
            } else {
                console.log(`ℹ️  Role '${roleName}' already exists with ID: ${res.rows[0].id}`);
            }
        }

        console.log('\n✅ Role fix completed.');

        // Show final table state
        const allRoles = await client.query('SELECT * FROM roles ORDER BY id');
        console.table(allRoles.rows);

    } catch (err) {
        console.error('❌ Error fixing roles:', err);
    } finally {
        await client.end();
    }
}

fixRoles();
