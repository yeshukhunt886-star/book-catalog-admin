import express from "express";

import {
    registerAdmin,
    loginAdmin,
    getCurrentAdmin,
    logoutAdmin
} from "../controllers/authController.js";

import {
    authenticateAdmin,
    requireAdmin
} from "../middleware/authMiddleware.js";

const router = express.Router();


// =====================================================
// ADMIN REGISTRATION
// POST /api/auth/register
// =====================================================

router.post(
    "/register",
    registerAdmin
);


// =====================================================
// ADMIN LOGIN
// POST /api/auth/login
// =====================================================

router.post(
    "/login",
    loginAdmin
);


// =====================================================
// GET CURRENT ADMIN
// GET /api/auth/me
// ADMIN AUTHENTICATED
// =====================================================

router.get(
    "/me",
    authenticateAdmin,
    requireAdmin,
    getCurrentAdmin,
    logoutAdmin
);


export default router;

router.post("/logout", authenticateAdmin, requireAdmin, logoutAdmin);
