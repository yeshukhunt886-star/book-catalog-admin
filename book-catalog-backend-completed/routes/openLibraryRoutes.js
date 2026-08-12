import express from "express";

import {
    searchByKeyword,
    searchBySubject,
    fetchBooks
} from "../controllers/openLibraryController.js";

const router = express.Router();


/*
|--------------------------------------------------------------------------
| Search by keyword
|--------------------------------------------------------------------------
| GET /api/open-library/search?keyword=harry
|--------------------------------------------------------------------------
*/

router.get(
    "/search",
    searchByKeyword
);


/*
|--------------------------------------------------------------------------
| Search by subject
|--------------------------------------------------------------------------
| GET /api/open-library/subject?subject=fiction
|--------------------------------------------------------------------------
*/

router.get(
    "/subject",
    searchBySubject
);


/*
|--------------------------------------------------------------------------
| Fetch books
|--------------------------------------------------------------------------
| GET /api/open-library/books?keyword=harry
|--------------------------------------------------------------------------
*/

router.get(
    "/books",
    fetchBooks
);


export default router;