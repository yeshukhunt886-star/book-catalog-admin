import {
    searchBooksByKeyword,
    searchBooksBySubject,
    fetchBookData
} from "../services/openLibraryService.js";


/*
|--------------------------------------------------------------------------
| Search By Keyword
|--------------------------------------------------------------------------
*/

export const searchByKeyword = async (req, res) => {

    try {

        const {
            keyword,
            page = 1,
            limit = 20
        } = req.query;

        if (!keyword) {

            return res.status(400).json({
                success: false,
                message: "Keyword is required"
            });
        }

        const result =
            await searchBooksByKeyword(
                keyword,
                Number(page),
                Number(limit)
            );

        return res.status(200).json({
            success: true,
            message: result.message,
            data: result
        });

    } catch (error) {

        console.error(
            "Search by keyword error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| Search By Subject
|--------------------------------------------------------------------------
*/

export const searchBySubject = async (req, res) => {

    try {

        const {
            subject,
            page = 1,
            limit = 20
        } = req.query;

        if (!subject) {

            return res.status(400).json({
                success: false,
                message: "Subject is required"
            });
        }

        const result =
            await searchBooksBySubject(
                subject,
                Number(page),
                Number(limit)
            );

        return res.status(200).json({
            success: true,
            message: result.message,
            data: result
        });

    } catch (error) {

        console.error(
            "Search by subject error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| Fetch Book Data
|--------------------------------------------------------------------------
*/

export const fetchBooks = async (req, res) => {

    try {

        const {
            keyword,
            subject,
            page = 1,
            limit = 20
        } = req.query;

        if (!keyword && !subject) {

            return res.status(400).json({
                success: false,
                message:
                    "Keyword or subject is required"
            });
        }

        const result =
            await fetchBookData({
                keyword,
                subject,
                page: Number(page),
                limit: Number(limit)
            });

        return res.status(200).json({
            success: true,
            message: result.message,
            data: result
        });

    } catch (error) {

        console.error(
            "Fetch books error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};