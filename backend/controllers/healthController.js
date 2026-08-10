import { testDatabaseConnection } from "../config/db.js";

export const healthCheck = async (req, res, next) => {
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

export const databaseHealthCheck = async (req, res, next) => {
    try {
        await testDatabaseConnection();

        res.status(200).json({
            success: true,
            message: "Database connection is healthy"
        });
    } catch (error) {
        next(error);
    }
};