import dotenv from "dotenv";

import app from "./app.js";

import { testDatabaseConnection } from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

/*
=====================================================
START SERVER
=====================================================
*/

const startServer = async () => {
    try {
        /*
        ---------------------------------------------
        Test MySQL Connection
        ---------------------------------------------
        */

        await testDatabaseConnection();

        /*
        ---------------------------------------------
        Start Express Server
        ---------------------------------------------
        */

        app.listen(PORT, () => {
            console.log("");
            console.log(" BOOK CATALOG ADMIN PORTAL");
            console.log(` Server: http://localhost:${PORT}`);
            console.log(` Health: http://localhost:${PORT}/api/health`);
            console.log(
                ` Database: http://localhost:${PORT}/api/health/database`
            );
            console.log("");
        });
    } catch (error) {
        console.error("");
        console.error(" SERVER STARTUP FAILED");
        console.error(error.message);

        process.exit(1);
    }
};

startServer();