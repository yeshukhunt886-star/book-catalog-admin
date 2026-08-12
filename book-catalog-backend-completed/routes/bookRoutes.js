import express from "express";

import {
    getBooks,
    getDataQualityDashboard,
    getBookById,
    createBook,
    updateBookLocalFields,
    deleteBook
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
    updateBookLocalFields
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