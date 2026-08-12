import express from "express";

import {
    getAuthors,
    getAuthorDetails,
    getAuthorStatistics,
    updateAuthor,
    deleteAuthor
} from "../controllers/authorController.js";

import {
    authenticateAdmin
} from "../middleware/authMiddleware.js";

const router = express.Router();

// =====================================================
// GET ALL AUTHORS
// GET /api/authors
// =====================================================

router.get(
    "/",
    authenticateAdmin,
    getAuthors
);

// =====================================================
// AUTHOR STATISTICS
// GET /api/authors/statistics
// =====================================================

router.get(
    "/statistics",
    authenticateAdmin,
    getAuthorStatistics
);

// =====================================================
// GET AUTHOR DETAILS
// GET /api/authors/:id
// =====================================================

router.get(
    "/:id",
    authenticateAdmin,
    getAuthorDetails
);

// =====================================================
// UPDATE AUTHOR
// PATCH /api/authors/:id
// =====================================================

router.patch(
    "/:id",
    authenticateAdmin,
    updateAuthor
);

// =====================================================
// DELETE AUTHOR
// DELETE /api/authors/:id
// =====================================================

router.delete(
    "/:id",
    authenticateAdmin,
    deleteAuthor
);

export default router;