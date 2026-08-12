import express from "express";

import {
    getDataQualityDashboard,
    getDataQualityIssues,
    getDataQualityIssueSummary,
    getDataQualityBooks,
    getDataQualityBookDetails,
    recalculateDataQuality,
    recalculateBookDataQuality,
    exportDataQuality
} from "../controllers/bookController.js";

import {
    authenticateAdmin
} from "../middleware/authMiddleware.js";

const router = express.Router();

// =====================================================
// STEP 15.1 — DATA QUALITY DASHBOARD
// GET /api/data-quality
// =====================================================

router.get(
    "/",
    authenticateAdmin,
    getDataQualityDashboard
);

// =====================================================
// STEP 15.2 — DATA QUALITY ISSUES
// GET /api/data-quality/issues
// =====================================================

router.get(
    "/issues",
    authenticateAdmin,
    getDataQualityIssues
);

// =====================================================
// STEP 15.4 — DATA QUALITY ISSUE SUMMARY
// GET /api/data-quality/issues/summary
// =====================================================

router.get(
    "/issues/summary",
    authenticateAdmin,
    getDataQualityIssueSummary
);

// =====================================================
// STEP 15.5 — DATA QUALITY FILTER
// GET /api/data-quality/books
// =====================================================

router.get(
    "/books",
    authenticateAdmin,
    getDataQualityBooks
);

// =====================================================
// STEP 15.6 — DATA QUALITY BOOK DETAILS
// GET /api/data-quality/books/:id
// =====================================================

router.get(
    "/books/:id",
    authenticateAdmin,
    getDataQualityBookDetails
);

// =====================================================
// STEP 15.7 — RECALCULATE SINGLE BOOK
// POST /api/data-quality/books/:id/recalculate
// =====================================================

router.post(
    "/books/:id/recalculate",
    authenticateAdmin,
    recalculateBookDataQuality
);

// =====================================================
// STEP 15.8 — RECALCULATE ALL BOOKS
// POST /api/data-quality/recalculate
// =====================================================

router.post(
    "/recalculate",
    authenticateAdmin,
    recalculateDataQuality
);

// =====================================================
// STEP 15.9 — DATA QUALITY EXPORT
// GET /api/data-quality/export
// =====================================================

router.get(
    "/export",
    authenticateAdmin,
    exportDataQuality
);

export default router;