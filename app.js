const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;

// =======================================================================
// IMPORTANT: Database Configuration
// !!! Replace with environment variables in a real application !!!
// =======================================================================
const dbConfig = {
    user: 'postgres',
    host: 'eventtracker-db.c34wiy840f9m.us-east-2.rds.amazonaws.com',
    database: 'postgres',
    password: "brcZi'eg;$}C6:F",
    port: 5432,
    ssl: {
        rejectUnauthorized: false,
    }
};

const pool = new Pool(dbConfig);

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    // Note: Do not exit process in a test environment, or it will halt the tests.
});

// The core function remains the same
async function runTestQueries(client) {
    // ... (rest of runTestQueries function) ...
    const dropQuery = `DROP TABLE IF EXISTS test_users;`;
    await client.query(dropQuery);

    const createQuery = `
        CREATE TABLE test_users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await client.query(createQuery);

    const insertQuery = `
        INSERT INTO test_users (username) VALUES ('test_user_express') RETURNING id;
    `;
    const insertResult = await client.query(insertQuery);

    const selectQuery = `SELECT id, username, created_at FROM test_users;`;
    const selectResult = await client.query(selectQuery);
    return selectResult.rows;
}


// Define the main test endpoint
app.get('/test-db', async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        
        // Use a transaction for the test
        await client.query('BEGIN');
        const data = await runTestQueries(client);
        await client.query('COMMIT');

        res.status(200).json({
            status: 'Success',
            message: 'Database connection and test queries executed successfully.',
            data: data
        });
    } catch (err) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Database Query Error:', err.message);
        res.status(500).json({
            status: 'Error',
            message: 'A database error occurred. Check server logs for details.',
            error: err.message,
            hint: "Ensure your RDS Security Group allows inbound connections from your server's IP (port 5432)."
        });
    } finally {
        if (client) {
            client.release();
        }
    }
});


// Simple root endpoint
app.get('/', (req, res) => {
    res.send('Welcome to the RDS Query Tester. Go to <a href="/test-db">/test-db</a> to run the queries.');
});


// Start the server ONLY if not in a test environment
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
        console.log(`Test Endpoint: http://localhost:${port}/test-db`);
    });
}

// Export the app for testing
module.exports = { app, pool };