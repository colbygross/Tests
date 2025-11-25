const request = require('supertest');
// Import the app and pool from the application file
const { app, pool } = require('./app'); 

// Group of tests for the application
describe('Express Endpoint Integration Tests', () => {

    // Teardown: Close the database pool after all tests are done
    afterAll(async () => {
        await pool.end();
    });

    // --- Test for the Root Endpoint (Simple GET) ---
    describe('GET /', () => {
        it('should respond with a welcome message and status 200', async () => {
            const response = await request(app).get('/');
            
            // 1. Assert the HTTP status code
            expect(response.statusCode).toBe(200);
            
            // 2. Assert the response text contains the expected message
            expect(response.text).toContain('Welcome to the RDS Query Tester');
        });
    });

    // --- Test for the Database Test Endpoint (/test-db) ---
    describe('GET /test-db', () => {
        it('should successfully connect to the DB, run queries, and return a single test user', async () => {
            // Note: This test requires a valid, running database connection
            const response = await request(app).get('/test-db');

            if (response.statusCode === 500) {
                // Log the error for better debugging in case of failure
                console.error("DB Test Failed with 500:", response.body.error);
                console.error("DB Hint:", response.body.hint);
            }

            // 1. Assert the HTTP status code is 200 for success
            expect(response.statusCode).toBe(200);

            // 2. Assert the status in the JSON response
            expect(response.body.status).toBe('Success');
            
            // 3. Assert the 'data' array contains exactly one record
            expect(response.body.data).toHaveLength(1);
            
            // 4. Assert the properties of the returned user record
            const user = response.body.data[0];
            expect(user).toHaveProperty('id');
            expect(user.username).toBe('test_user_express');
            expect(user).toHaveProperty('created_at');
            
            // 5. Assert the ID is a number (PostgreSQL SERIAL type)
            expect(typeof user.id).toBe('number');
        }, 30000); // Increase timeout for the database test (30 seconds)
    });
});