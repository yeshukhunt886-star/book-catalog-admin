import express from "express";

import {
    authenticateAdmin
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/",
    authenticateAdmin,
    getBooks
);

router.post(
    "/",
    authenticateAdmin,
    createBook
);

router.put(
    "/:id",
    authenticateAdmin,
    updateBook
);

router.delete(
    "/:id",
    authenticateAdmin,
    deleteBook
);

export default router;