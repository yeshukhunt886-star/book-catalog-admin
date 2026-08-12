import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";

import {
    testDatabaseConnection,
    closeDatabaseConnection
} from "./config/db.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await testDatabaseConnection();

        const server = app.listen(PORT, () => {
            console.log("");
            console.log("BOOK CATALOG ADMIN PORTAL");
            console.log(`Server: http://localhost:${PORT}`);
            console.log(`Health: http://localhost:${PORT}/api/health`);
            console.log(
                `Database: http://localhost:${PORT}/api/health/database`
            );
            console.log("");
        });

        const shutdownServer = async (signal) => {
            console.log(`\n${signal} received.`);
            console.log("Closing HTTP server...");

            server.close(async () => {
                await closeDatabaseConnection();

                console.log("Server shutdown completed.");
                process.exit(0);
            });
        };

        process.on("SIGINT", () => shutdownServer("SIGINT"));
        process.on("SIGTERM", () => shutdownServer("SIGTERM"));

    } catch (error) {
        console.error("");
        console.error("SERVER STARTUP FAILED");
        console.error(error.message);

        process.exit(1);
    }
};

startServer();