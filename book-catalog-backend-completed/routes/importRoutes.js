import express from "express";

import {
    startBookImport,
    getImportJobs,
    getImportJob
} from "../controllers/importController.js";

import {
    authenticateAdmin,
    requireAdmin,
    requireAdminOrViewer
} from "../middleware/authMiddleware.js";

import {
    importRateLimit
} from "../middleware/importRateLimitMiddleware.js";

const router = express.Router();

// =====================================================
// START BOOK IMPORT
// POST /api/imports/books
// =====================================================

router.post(
    "/books",
    authenticateAdmin,
    requireAdmin,
    importRateLimit,
    startBookImport
);

// =====================================================
// GET IMPORT JOBS
// GET /api/imports/jobs
// =====================================================

router.get(
    "/jobs",
    authenticateAdmin,
    requireAdminOrViewer,
    getImportJobs
);

// =====================================================
// GET IMPORT JOB
// GET /api/imports/jobs/:id
// =====================================================

router.get(
    "/jobs/:id",
    authenticateAdmin,
    requireAdminOrViewer,
    getImportJob
);

// =====================================================
// REQUIREMENT-COMPATIBLE ENDPOINT
// POST /api/imports
// =====================================================

router.post(
    "/",
    authenticateAdmin,
    requireAdmin,
    importRateLimit,
    startBookImport
);

// =====================================================
// GET /api/imports
// =====================================================

router.get(
    "/",
    authenticateAdmin,
    requireAdminOrViewer,
    getImportJobs
);

// =====================================================
// GET /api/imports/:id
// =====================================================

router.get(
    "/:id",
    authenticateAdmin,
    requireAdminOrViewer,
    getImportJob
);

export default router;