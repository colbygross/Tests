// Import necessary modules
const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;

// =======================================================================
// IMPORTANT: Database Configuration
// For production, always use environment variables (e.g., process.env.DB_HOST).
// =======================================================================
const dbConfig = {
    user: 'postgres', // e.g., 'postgres'
    host: 'eventtracker-db.c34wiy840f9m.us-east-2.rds.amazonaws.com',        // e.g., 'my-db.xxxxxxxx.us-east-1.rds.amazonaws.com'
    database: 'postgres',   // The database name you created
    password: "brcZi'eg;$}C6:F", // The password for the master user
    port: 5432,                       // Default PostgreSQL port
    ssl: {
        // AWS RDS requires SSL/TLS. Setting rejectUnauthorized to true is often necessary
        // to avoid self-signed certificate errors when connecting from outside AWS VPC.
        // You may need to set this to false if you encounter certificate issues and are running
        // in a non-production environment, but true is preferred for security.
        rejectUnauthorized: false,
    }
};

// Create a new Pool instance for managing database connections
const pool = new Pool(dbConfig);

// Event listener to log connection errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

/**
 * Executes a series of test queries against the PostgreSQL database.
 * @param {object} client - The database client instance.
 * @returns {object} The results of the successful SELECT query.
 */
async function runTestQueries(client) {
    console.log('--- Starting Test Queries ---');

    // 1. Drop table if it exists (for a clean test run)
    const dropQuery = `DROP TABLE IF EXISTS test_users;`;
    await client.query(dropQuery);
    console.log('1. Dropped table "test_users" (if it existed).');

    // 2. Create the test table (similar to your initialization file)
    const createQuery = `
        CREATE TABLE test_users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await client.query(createQuery);
    console.log('2. Created table "test_users".');

    // 3. Insert a test record
    const insertQuery = `
        INSERT INTO test_users (username) VALUES ('test_user_express') RETURNING id;
    `;
    const insertResult = await client.query(insertQuery);
    console.log(`3. Inserted test user with ID: ${insertResult.rows[0].id}`);

    // 4. Select the data back
    const selectQuery = `SELECT id, username, created_at FROM test_users;`;
    const selectResult = await client.query(selectQuery);
    console.log('4. Successfully selected data.');

    console.log('--- Test Queries Complete ---');
    return selectResult.rows;
}


// Define the main test endpoint
app.get('/test-db', async (req, res) => {
    let client;
    try {
        // Get a client from the pool
        client = await pool.connect();
        
        // Run the test queries within a transaction for safety
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
            // Rollback the transaction on error
            await client.query('ROLLBACK');
        }
        console.error('Database Query Error:', err.message);
        res.status(500).json({
            status: 'Error',
            message: 'A database error occurred. Check server logs for details.',
            error: err.message,
            // Hint for common RDS issues
            hint: "Ensure your RDS Security Group allows inbound connections from your server's IP (port 5432)."
        });
    } finally {
        // Release the client back to the pool
        if (client) {
            client.release();
        }
    }
});


// Simple root endpoint
app.get('/', (req, res) => {
    res.send('Welcome to the RDS Query Tester. Go to <a href="/test-db">/test-db</a> to run the queries.');
});


// Start the Express server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`Test Endpoint: http://localhost:${port}/test-db`);
});