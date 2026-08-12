import express from "express";

import {
    healthCheck,
    databaseHealthCheck
} from "../controllers/healthController.js";

const router = express.Router();

// SERVER HEALTH
router.get(
    "/",
    healthCheck
);

// DATABASE HEALTH
router.get(
    "/database",
    databaseHealthCheck
);

export default router;