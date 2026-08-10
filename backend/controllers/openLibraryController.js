import {
    searchBooks,
    getBookByKey,
    getAuthorByKey
} from "../services/openLibraryService.js";


/*
=====================================================
SEARCH OPEN LIBRARY
=====================================================
*/

export const searchOpenLibraryBooks = async (
    req,
    res,
    next
) => {
    try {
        const {
            q,
            page = 1,
            limit = 20
        } = req.query;

        if (!q || !q.trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Search query is required"
            });
        }

        const safePage =
            Math.max(
                Number(page) || 1,
                1
            );

        const safeLimit =
            Math.min(
                Math.max(
                    Number(limit) || 20,
                    1
                ),
                100
            );

        const result =
            await searchBooks({
                query: q,
                page: safePage,
                limit: safeLimit
            });

        res.status(200).json({
            success: true,

            source: "Open Library",

            query: q,

            page: safePage,

            limit: safeLimit,

            total:
                result.numFound,

            count:
                result.docs.length,

            data:
                result.docs
        });
    } catch (error) {
        next(error);
    }
};


/*
=====================================================
GET OPEN LIBRARY BOOK
=====================================================
*/

export const getOpenLibraryBook = async (
    req,
    res,
    next
) => {
    try {
        const { key } = req.params;

        if (!key) {
            return res.status(400).json({
                success: false,
                message:
                    "Book key is required"
            });
        }

        const book =
            await getBookByKey(key);

        res.status(200).json({
            success: true,

            source: "Open Library",

            data: book
        });
    } catch (error) {
        next(error);
    }
};


/*
=====================================================
GET OPEN LIBRARY AUTHOR
=====================================================
*/

export const getOpenLibraryAuthor = async (
    req,
    res,
    next
) => {
    try {
        const { key } = req.params;

        if (!key) {
            return res.status(400).json({
                success: false,
                message:
                    "Author key is required"
            });
        }

        const author =
            await getAuthorByKey(key);

        res.status(200).json({
            success: true,

            source: "Open Library",

            data: author
        });
    } catch (error) {
        next(error);
    }
};