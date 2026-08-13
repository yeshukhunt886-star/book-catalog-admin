import express from "express";

import {
    getReportsSummary,
    getBooksReport,
    exportBooksCSV,
    getDataQualityReport,
    getBooksBySubject,
    getBooksByPublishYear,
    getTopAuthors,
    getImportHistory,
    exportReportsCSV
} from "../controllers/reportController.js";

import {
    authenticateAdmin,
    requireAdmin
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/summary",
    authenticateAdmin,
    requireAdmin,
    getReportsSummary
);

router.get(
    "/books",
    authenticateAdmin,
    requireAdmin,
    getBooksReport
);

router.get(
    "/books/export",
    authenticateAdmin,
    requireAdmin,
    exportBooksCSV
);

router.get(
    "/data-quality",
    authenticateAdmin,
    requireAdmin,
    getDataQualityReport
);

router.get(
    "/subjects",
    authenticateAdmin,
    requireAdmin,
    getBooksBySubject
);

router.get(
    "/publish-years",
    authenticateAdmin,
    requireAdmin,
    getBooksByPublishYear
);

router.get(
    "/authors",
    authenticateAdmin,
    requireAdmin,
    getTopAuthors
);

router.get(
    "/import-history",
    authenticateAdmin,
    requireAdmin,
    getImportHistory
);

router.get(
    "/export",
    authenticateAdmin,
    requireAdmin,
    exportReportsCSV
);

export default router;