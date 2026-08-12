import express from "express";

import {
    getSubjects,
    getSubjectDetails,
    getSubjectStatistics,
    createSubject,
    updateSubject,
    deleteSubject
} from "../controllers/subjectController.js";

import {
    authenticateAdmin,
    requireAdmin,
    requireAdminOrViewer
} from "../middleware/authMiddleware.js";

const router = express.Router();


// =====================================================
// GET ALL SUBJECTS
// GET /api/subjects
// ADMIN + VIEWER
// =====================================================

router.get(
    "/",
    authenticateAdmin,
    requireAdminOrViewer,
    getSubjects
);


// =====================================================
// SUBJECT STATISTICS
// GET /api/subjects/statistics
// ADMIN + VIEWER
// =====================================================

router.get(
    "/statistics",
    authenticateAdmin,
    requireAdminOrViewer,
    getSubjectStatistics
);


// =====================================================
// GET SUBJECT DETAILS
// GET /api/subjects/:id
// ADMIN + VIEWER
// =====================================================

router.get(
    "/:id",
    authenticateAdmin,
    requireAdminOrViewer,
    getSubjectDetails
);


// =====================================================
// CREATE SUBJECT
// POST /api/subjects
// ADMIN ONLY
// =====================================================

router.post(
    "/",
    authenticateAdmin,
    requireAdmin,
    createSubject
);


// =====================================================
// UPDATE SUBJECT
// PATCH /api/subjects/:id
// ADMIN ONLY
// =====================================================

router.patch(
    "/:id",
    authenticateAdmin,
    requireAdmin,
    updateSubject
);


// =====================================================
// DELETE SUBJECT
// DELETE /api/subjects/:id
// ADMIN ONLY
// =====================================================

router.delete(
    "/:id",
    authenticateAdmin,
    requireAdmin,
    deleteSubject
);


export default router;