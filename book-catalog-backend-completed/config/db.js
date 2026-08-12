import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/*
=====================================================
DATABASE CONFIGURATION
=====================================================
*/

const dbConfig = {
    host: process.env.DB_HOST || "localhost",

    port: Number(process.env.DB_PORT || 3306),

    user: process.env.DB_USER || "root",

    password: process.env.DB_PASSWORD || "",

    database: process.env.DB_NAME || "book_catalog",

    waitForConnections: true,

    connectionLimit: Number(
        process.env.DB_CONNECTION_LIMIT || 10
    ),

    queueLimit: 0,

    enableKeepAlive: true,

    keepAliveInitialDelay: 0
};

/*
=====================================================
MYSQL CONNECTION POOL
=====================================================
*/

const pool = mysql.createPool(dbConfig);

/*
=====================================================
TEST DATABASE CONNECTION
=====================================================
*/

export const testDatabaseConnection = async () => {
    let connection;

    try {
        connection = await pool.getConnection();

        await connection.query("SELECT 1");

        console.log("MySQL connected successfully");

        return true;
    } catch (error) {
        console.error(
            "MySQL connection failed:",
            error.message
        );

        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/*
=====================================================
GET DATABASE CONNECTION
=====================================================
*/

export const getConnection = async () => {
    return await pool.getConnection();
};

/*
=====================================================
CLOSE DATABASE POOL
=====================================================
*/

export const closeDatabaseConnection = async () => {
    try {
        await pool.end();

        console.log("MySQL connection pool closed");
    } catch (error) {
        console.error(
            "Error closing MySQL pool:",
            error.message
        );
    }
};

export default pool;