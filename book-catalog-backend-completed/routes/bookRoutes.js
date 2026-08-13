import express from "express";

import {
    getBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
    getDataQualityDashboard,
    markBookAsReviewed
} from "../controllers/bookController.js";

import {
    authenticateAdmin,
    requireAdmin,
    requireAdminOrViewer
} from "../middleware/authMiddleware.js";

const router = express.Router();

// =====================================================
// GET ALL BOOKS
// GET /api/books
// ADMIN + VIEWER
// =====================================================

router.get(
    "/",
    authenticateAdmin,
    requireAdminOrViewer,
    getBooks
);

// =====================================================
// DATA QUALITY
// GET /api/books/data-quality
// ADMIN + VIEWER
// =====================================================

router.get(
    "/data-quality",
    authenticateAdmin,
    requireAdminOrViewer,
    getDataQualityDashboard
);

// =====================================================
// MARK BOOK AS REVIEWED
// PATCH /api/books/:id/review
// ADMIN ONLY
// =====================================================

router.patch(
    "/:id/review",
    authenticateAdmin,
    requireAdmin,
    markBookAsReviewed
);

// =====================================================
// GET BOOK DETAILS
// GET /api/books/:id
// ADMIN + VIEWER
// =====================================================

router.get(
    "/:id",
    authenticateAdmin,
    requireAdminOrViewer,
    getBookById
);

// =====================================================
// CREATE BOOK
// POST /api/books
// ADMIN ONLY
// =====================================================

router.post(
    "/",
    authenticateAdmin,
    requireAdmin,
    createBook
);

// =====================================================
// UPDATE BOOK
// PATCH /api/books/:id
// ADMIN ONLY
// =====================================================

router.patch(
    "/:id",
    authenticateAdmin,
    requireAdmin,
    updateBook
);

// =====================================================
// DELETE BOOK
// DELETE /api/books/:id
// ADMIN ONLY
// =====================================================

router.delete(
    "/:id",
    authenticateAdmin,
    requireAdmin,
    deleteBook
);

export default router;