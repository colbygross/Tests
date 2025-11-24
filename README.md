# 🚀 AWS RDS PostgreSQL Connection Tester

This is a minimal Express server application designed to **verify connectivity** and **basic CRUD operations** against an **AWS RDS PostgreSQL** instance.

The primary purpose of this server is to provide a clear, executable test case for ensuring the application can successfully:
1.  Connect to the remote database using the configured credentials.
2.  Execute standard SQL commands (DROP, CREATE, INSERT, SELECT).
3.  Handle transactions (BEGIN, COMMIT, ROLLBACK) correctly.

---

## 🧪 Testing Logic Overview

The core testing functionality is encapsulated in the `GET /test-db` endpoint, which executes a sequence of database operations within a **single transaction**.

### 1. Database Connection

The server uses the `pg` module's **`Pool`** to manage database connections.

* A connection is acquired from the pool using `pool.connect()`.
* The configuration explicitly includes `ssl: { rejectUnauthorized: false }` to handle the SSL/TLS requirement for AWS RDS, which is often necessary when connecting from outside the AWS VPC.

### 2. Transactional Test Execution

All test queries are wrapped in a **database transaction** to ensure data integrity and cleanliness:

| Step | SQL Command | Purpose |
| :--- | :--- | :--- |
| **BEGIN** | `BEGIN` | Marks the start of the transaction. All subsequent queries can be undone if an error occurs. |
| **Test Query 1** | `DROP TABLE IF EXISTS test_users;` | Ensures a clean slate by removing the test table if it already exists. |
| **Test Query 2** | `CREATE TABLE test_users (...)` | Creates a simple `test_users` table structure for the test. |
| **Test Query 3** | `INSERT INTO test_users (...)` | Inserts a single test record (`'test_user_express'`) to verify write functionality. |
| **Test Query 4** | `SELECT id, username, created_at FROM test_users;` | Selects the inserted data to verify read functionality and confirm the record exists. |
| **COMMIT** | `COMMIT` | If all test queries succeed, the changes (table creation, record insertion) are permanently saved to the database. |
| **ROLLBACK** | `ROLLBACK` | If **any** query fails, the `catch` block is executed, issuing a `ROLLBACK` to undo *all* operations within the transaction (e.g., the table is dropped, and the insert is undone), keeping the database in its pre-test state. |

### 3. Client Release

The `finally` block ensures the database client is always released back to the connection pool (`client.release()`), regardless of whether the test succeeded or failed, preventing connection leaks.

---

## 🛠️ How to Run the Test

1.  Ensure you have Node.js installed.
2.  Install dependencies: `npm install express pg`
3.  Save the code as `server.js` and run it: `node server.js`
4.  Open your browser or a tool like Postman and navigate to:
    `http://localhost:3000/test-db`

### Expected Successful Output

If the connection and queries are successful, you will receive a `200` response similar to:

```json
{
    "status": "Success",
    "message": "Database connection and test queries executed successfully.",
    "data": [
        {
            "id": 1,
            "username": "test_user_express",
            "created_at": "2025-11-24T14:20:00.000Z" // Actual timestamp will vary
        }
    ]
}