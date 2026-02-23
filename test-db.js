import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://neondb_owner:npg_x1op0tYwGdPZ@ep-odd-dawn-ai9rnwin-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

const client = new Client({
    connectionString: connectionString,
});

async function test() {
    try {
        await client.connect();
        console.log('Connected successfully to Neon!');
        const res = await client.query('SELECT NOW()');
        console.log('Result:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Connection error:', err);
    }
}

test();
