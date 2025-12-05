
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function checkRoles() {
    try {
        await client.connect();
        const res = await client.query('SELECT * FROM roles');
        console.log('Roles in DB:', res.rows);
    } catch (err) {
        console.error('Error querying roles:', err);
    } finally {
        await client.end();
    }
}

checkRoles();
