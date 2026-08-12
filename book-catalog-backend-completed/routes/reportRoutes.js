
import express from "express";

import {
    getReportsSummary,
    exportBooksCSV,
    getBooksReport,
    getDataQualityReport
} from "../controllers/reportController.js";

import {
    authenticateAdmin
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
=====================================================
REPORTS SUMMARY
GET /api/reports/summary
=====================================================
*/
router.get(
    "/summary",
    authenticateAdmin,
    getReportsSummary
);

/*
=====================================================
BOOKS REPORT
GET /api/reports/books
=====================================================
*/
router.get(
    "/books",
    authenticateAdmin,
    getBooksReport,
    getDataQualityReport
);

/*
=====================================================
CSV EXPORT
GET /api/reports/books/export/csv
=====================================================
*/
router.get(
    "/books/export/csv",
    authenticateAdmin,
    exportBooksCSV
);

export default router;
router.get("/data-quality", authenticateAdmin, getDataQualityReport);
