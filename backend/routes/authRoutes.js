import express from "express";

import {
    registerAdmin,
    loginAdmin,
    getCurrentAdmin
} from "../controllers/authController.js";

import {
    authenticateAdmin
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
=====================================================
REGISTER
=====================================================
*/

router.post(
    "/register",
    registerAdmin
);

/*
=====================================================
LOGIN
=====================================================
*/

router.post(
    "/login",
    loginAdmin
);

/*
=====================================================
CURRENT ADMIN
=====================================================
*/

router.get(
    "/me",
    authenticateAdmin,
    getCurrentAdmin
);

export default router;