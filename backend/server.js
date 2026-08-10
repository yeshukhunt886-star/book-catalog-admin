import dotenv from "dotenv";

import app from "./app.js";

import {
    testDatabaseConnection,
    closeDatabaseConnection
} from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;


// START SERVER
const startServer = async () => {
    try {
        
        // Test MySQL
        await testDatabaseConnection();

        
        // Start Express
        const server = app.listen(
            PORT,
            () => {
                console.log(""); 
                console.log( " BOOK CATALOG ADMIN PORTAL");
                console.log( ` Server: http://localhost:${PORT}`);
                console.log( ` Health: http://localhost:${PORT}/api/health`);
                console.log(` Database: http://localhost:${PORT}/api/health/database`);
            
                console.log("");
            }
        );

    
        // GRACEFUL SHUTDOWN
        const shutdownServer = async (
            signal
        ) => {
            console.log(
                `\n${signal} received.`
            );

            console.log(
                "Closing HTTP server..."
            );

            server.close(async () => {
                await closeDatabaseConnection();

                console.log(
                    "Server shutdown completed."
                );

                process.exit(0);
            });
        };

        process.on(
            "SIGINT",
            () => shutdownServer("SIGINT")
        );

        process.on(
            "SIGTERM",
            () => shutdownServer("SIGTERM")
        );
    } catch (error) {
        console.error("");
        console.error(" SERVER STARTUP FAILED");
        console.error(error.message);

        process.exit(1);
    }
};

startServer();