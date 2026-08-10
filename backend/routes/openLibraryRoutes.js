import express from "express";

import {
    searchOpenLibraryBooks,
    getOpenLibraryBook,
    getOpenLibraryAuthor
} from "../controllers/openLibraryController.js";

import {
    authenticateAdmin
} from "../middleware/authMiddleware.js";

const router = express.Router();


/*
=====================================================
SEARCH BOOKS
=====================================================
*/

router.get(
    "/search",
    authenticateAdmin,
    searchOpenLibraryBooks
);


/*
=====================================================
GET BOOK
=====================================================
*/

router.get(
    "/books/:key",
    authenticateAdmin,
    getOpenLibraryBook
);


/*
=====================================================
GET AUTHOR
=====================================================
*/

router.get(
    "/authors/:key",
    authenticateAdmin,
    getOpenLibraryAuthor
);


export default router;