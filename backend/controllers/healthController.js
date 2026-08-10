import pool from "../config/db.js";

/*
=====================================================
SERVER HEALTH
=====================================================
*/

export const healthCheck = async (
    req,
    res,
    next
) => {
    try {
        res.status(200).json({
            success: true,
            message: "Book Catalog API is running",
            server: "online",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
};

/*
=====================================================
DATABASE HEALTH
=====================================================
*/

export const databaseHealthCheck = async (
    req,
    res,
    next
) => {
    try {
        const [rows] = await pool.execute(
            "SELECT 1 AS database_connected"
        );

        res.status(200).json({
            success: true,
            message: "Database connection is healthy",
            database: {
                connected:
                    rows[0].database_connected === 1
            }
        });
    } catch (error) {
        next(error);
    }
};