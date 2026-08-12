import express from "express";

import {
    getAuditLogs
} from "../controllers/auditLogController.js";

import {
    authenticateAdmin
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateAdmin,
    getAuditLogs
);

export default router;