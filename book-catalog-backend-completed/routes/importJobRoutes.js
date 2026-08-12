import express from "express";

import {
    getImportJobs,
    getImportJobDetails,
    getImportJobLogs,
    createImportJobLog,
    getImportJobStats,
    updateImportJobStats,
    getImportHistory,
     cancelImportJob
} from "../controllers/importJobController.js";

import {
    authenticateAdmin
} from "../middleware/authMiddleware.js";

const router = express.Router();

// =====================================================
// IMPORT JOB LIST
// GET /api/import-jobs
// =====================================================

router.get(
    "/",
    authenticateAdmin,
    getImportJobs
);

// =====================================================
// IMPORT HISTORY
// GET /api/import-jobs/history
// IMPORTANT: MUST COME BEFORE /:id
// =====================================================

router.get(
    "/history",
    authenticateAdmin,
    getImportHistory
);

// =====================================================
// IMPORT JOB LOGS
// GET /api/import-jobs/:id/logs
// =====================================================

router.get(
    "/:id/logs",
    authenticateAdmin,
    getImportJobLogs
);

// =====================================================
// IMPORT JOB STATS
// GET /api/import-jobs/:id/stats
// =====================================================

router.get(
    "/:id/stats",
    authenticateAdmin,
    getImportJobStats
);

// =====================================================
// UPDATE IMPORT JOB STATS
// PATCH /api/import-jobs/:id/stats
// =====================================================

router.patch(
    "/:id/stats",
    authenticateAdmin,
    updateImportJobStats
);

// =====================================================
// CREATE IMPORT JOB LOG
// POST /api/import-jobs/:id/logs
// =====================================================

router.post(
    "/:id/logs",
    authenticateAdmin,
    createImportJobLog
);

// =====================================================
// IMPORT JOB DETAILS
// GET /api/import-jobs/:id
// IMPORTANT: KEEP THIS LAST
// =====================================================

router.get(
    "/:id",
    authenticateAdmin,
    getImportJobDetails
);

// =====================================================
// STEP 16.4 — CANCEL IMPORT JOB
// PATCH /api/import-jobs/:id/cancel
// =====================================================

router.patch(
    "/:id/cancel",
    authenticateAdmin,
    cancelImportJob
);

export default router;