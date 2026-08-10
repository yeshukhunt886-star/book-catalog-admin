import express from "express";

import {
    healthCheck,
    databaseHealthCheck
} from "../controllers/healthController.js";

const router = express.Router();

router.get("/", healthCheck);

router.get("/database", databaseHealthCheck);

export default router;