import express from "express";

import {
    startBookImport
} from "../controllers/importController.js";

import {
    authenticateAdmin
} from "../middleware/authMiddleware.js";

const router = express.Router();


/*
=====================================================
IMPORT BOOKS
=====================================================
*/

router.post(
    "/books",
    authenticateAdmin,
    startBookImport
);


export default router;