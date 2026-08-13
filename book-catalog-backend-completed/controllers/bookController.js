import pool from "../config/db.js";
import {
    validateBook
} from "../utils/bookValidator.js";

/*
=====================================================
GET BOOKS
=====================================================

STEP 12.1 → List Books
STEP 12.2 → Pagination
STEP 12.3 → Search
STEP 12.4 → Filters
STEP 12.5 → Sorting

SEARCH:
- title
- subtitle
- author
- subject
- ISBN
- publish year

FILTER:
- subject
- author
- language
- minimum publish year
- maximum publish year
- data quality

SORT:
- title
- publish_year
- recently_imported
- recently_updated

ORDER:
- asc
- desc

Examples:
GET /api/books?sort=title&order=asc
GET /api/books?sort=title&order=desc
GET /api/books?sort=publish_year&order=asc
GET /api/books?sort=publish_year&order=desc
GET /api/books?sort=recently_imported&order=desc
GET /api/books?sort=recently_updated&order=desc
Combined:

GET /api/books?search=book&language=eng&sort=title&order=asc&page=1&limit=10
=====================================================
*/

export const getBooks = async (req, res) => {

    try {

        /*
        =============================================
        PAGINATION
        =============================================
        */

        let page =
            Number(req.query.page) || 1;

        let limit =
            Number(req.query.limit) || 20;

        if (page < 1) {
            page = 1;
        }

        if (limit < 1) {
            limit = 20;
        }

        // Maximum 100 records per page
        if (limit > 100) {
            limit = 100;
        }

        const offset =
            (page - 1) * limit;


        /*
        =============================================
        SEARCH
        =============================================
        */

        const search =
            typeof req.query.search === "string"
                ? req.query.search.trim()
                : "";


        /*
        =============================================
        FILTERS
        =============================================
        */

        const subject =
            typeof req.query.subject === "string"
                ? req.query.subject.trim()
                : "";

        const author =
            typeof req.query.author === "string"
                ? req.query.author.trim()
                : "";

        const language =
            typeof req.query.language === "string"
                ? req.query.language.trim()
                : "";

        const minYear =
            req.query.minYear !== undefined
                ? Number(req.query.minYear)
                : null;

        const maxYear =
            req.query.maxYear !== undefined
                ? Number(req.query.maxYear)
                : null;

        const quality =
            typeof req.query.quality === "string"
                ? req.query.quality.trim().toLowerCase()
                : "";


        /*
        =============================================
        SORTING
        =============================================

        Supported:

        title
        publish_year
        recently_imported
        recently_updated
        =============================================
        */

        const requestedSort =
            typeof req.query.sort === "string"
                ? req.query.sort.trim().toLowerCase()
                : "recently_imported";


        /*
        =============================================
        SAFE SORT COLUMNS
        =============================================
        */

        const sortMap = {

            title:
                "b.title",

            publish_year:
                "b.first_publish_year",

            recently_imported:
                "b.created_at",

            recently_updated:
                "b.updated_at"
        };


        /*
        =============================================
        DEFAULT SORT
        =============================================
        */

        const sortColumn =
            sortMap[requestedSort]
                || sortMap.recently_imported;


        /*
        =============================================
        SORT ORDER
        =============================================
        */

        const requestedOrder =
            typeof req.query.order === "string"
                ? req.query.order.trim().toLowerCase()
                : "desc";


        const sortOrder =
            requestedOrder === "asc"
                ? "ASC"
                : "DESC";


        /*
        =============================================
        CONDITIONS
        =============================================
        */

        const conditions = [];

        const queryParams = [];


        /*
        =============================================
        SEARCH CONDITION
        =============================================
        */

        if (search) {

            const searchValue =
                `%${search}%`;

            conditions.push(`
                (
                    b.title LIKE ?
                    OR b.subtitle LIKE ?

                    OR EXISTS (
                        SELECT 1
                        FROM book_authors ba
                        INNER JOIN authors a
                            ON a.id = ba.author_id
                        WHERE
                            ba.book_id = b.id
                            AND a.name LIKE ?
                    )

                    OR EXISTS (
                        SELECT 1
                        FROM book_subjects bs
                        INNER JOIN subjects s
                            ON s.id = bs.subject_id
                        WHERE
                            bs.book_id = b.id
                            AND s.name LIKE ?
                    )

                    OR b.isbn10 LIKE ?
                    OR b.isbn13 LIKE ?

                    OR CAST(
                        b.first_publish_year AS CHAR
                    ) LIKE ?
                )
            `);

            queryParams.push(
                searchValue,
                searchValue,
                searchValue,
                searchValue,
                searchValue,
                searchValue,
                searchValue
            );
        }


        /*
        =============================================
        SUBJECT FILTER
        =============================================
        */

        if (subject) {

            conditions.push(`
                EXISTS (
                    SELECT 1
                    FROM book_subjects bs
                    INNER JOIN subjects s
                        ON s.id = bs.subject_id
                    WHERE
                        bs.book_id = b.id
                        AND s.name LIKE ?
                )
            `);

            queryParams.push(
                `%${subject}%`
            );
        }


        /*
        =============================================
        AUTHOR FILTER
        =============================================
        */

        if (author) {

            conditions.push(`
                EXISTS (
                    SELECT 1
                    FROM book_authors ba
                    INNER JOIN authors a
                        ON a.id = ba.author_id
                    WHERE
                        ba.book_id = b.id
                        AND a.name LIKE ?
                )
            `);

            queryParams.push(
                `%${author}%`
            );
        }


        /*
        =============================================
        LANGUAGE FILTER
        =============================================
        */

        if (language) {

            conditions.push(`
                b.language = ?
            `);

            queryParams.push(
                language
            );
        }


        /*
        =============================================
        MINIMUM YEAR
        =============================================
        */

        if (
            minYear !== null &&
            Number.isInteger(minYear)
        ) {

            conditions.push(`
                b.first_publish_year >= ?
            `);

            queryParams.push(
                minYear
            );
        }


        /*
        =============================================
        MAXIMUM YEAR
        =============================================
        */

        if (
            maxYear !== null &&
            Number.isInteger(maxYear)
        ) {

            conditions.push(`
                b.first_publish_year <= ?
            `);

            queryParams.push(
                maxYear
            );
        }


        /*
        =============================================
        DATA QUALITY FILTER
        =============================================
        */

        if (quality === "high") {

            conditions.push(`
                b.data_quality_score >= 80
            `);
        }

        if (quality === "medium") {

            conditions.push(`
                b.data_quality_score >= 50
                AND b.data_quality_score < 80
            `);
        }

        if (quality === "low") {

            conditions.push(`
                b.data_quality_score < 50
            `);
        }


        /*
        =============================================
        BUILD WHERE CLAUSE
        =============================================
        */

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";


        /*
        =============================================
        COUNT TOTAL
        =============================================
        */

        const countQuery = `
            SELECT
                COUNT(*) AS total
            FROM books b
            ${whereClause}
        `;

        const [countRows] =
            await pool.execute(
                countQuery,
                queryParams
            );

        const total =
            Number(
                countRows[0]?.total || 0
            );


        /*
        =============================================
        TOTAL PAGES
        =============================================
        */

        const totalPages =
            total === 0
                ? 0
                : Math.ceil(
                    total / limit
                );


        /*
        =============================================
        GET BOOKS
        =============================================
        */

        const booksQuery = `
            SELECT
                b.id,
                b.open_library_key,
                b.title,
                b.subtitle,
                b.isbn10,
                b.isbn13,
                b.publisher,
                b.publish_date,
                b.first_publish_year,
                b.language,
                b.cover_url,
                b.page_count,
                b.data_source,
                b.data_quality_score,
                b.created_at,
                b.updated_at
            FROM books b
            ${whereClause}

            ORDER BY
                ${sortColumn} ${sortOrder},
                b.id DESC

            LIMIT ${limit}

            OFFSET ${offset}
        `;


        const [books] =
            await pool.execute(
                booksQuery,
                queryParams
            );


        /*
        =============================================
        PAGINATION
        =============================================
        */

        const hasNextPage =
            page < totalPages;

        const hasPreviousPage =
            page > 1 &&
            totalPages > 0;


        /*
        =============================================
        RESPONSE
        =============================================
        */

        return res.status(200).json({

            success: true,

            message:
                search ||
                subject ||
                author ||
                language ||
                minYear !== null ||
                maxYear !== null ||
                quality
                    ? "Books filtered successfully"
                    : "Books fetched successfully",

            data: {

                books,

                pagination: {

                    page,

                    limit,

                    total,

                    totalPages,

                    hasNextPage,

                    hasPreviousPage,

                    nextPage:
                        hasNextPage
                            ? page + 1
                            : null,

                    previousPage:
                        hasPreviousPage
                            ? page - 1
                            : null
                },

                filters: {

                    search:
                        search || null,

                    subject:
                        subject || null,

                    author:
                        author || null,

                    language:
                        language || null,

                    minYear:
                        minYear !== null &&
                        Number.isInteger(minYear)
                            ? minYear
                            : null,

                    maxYear:
                        maxYear !== null &&
                        Number.isInteger(maxYear)
                            ? maxYear
                            : null,

                    quality:
                        quality || null
                },

                sorting: {

                    sort:
                        sortMap[requestedSort]
                            ? requestedSort
                            : "recently_imported",

                    order:
                        sortOrder.toLowerCase()
                }
            }
        });

    } catch (error) {

        console.error(
            "GET BOOKS ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch books",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined
        });
    }
};

// =====================================================
// GET SINGLE BOOK DETAILS
// GET /api/books/:id
// =====================================================

export const getBookDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // ---------------------------------------------
        // Validate ID
        // ---------------------------------------------

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid book ID"
            });
        }

        // ---------------------------------------------
        // GET BOOK
        // ---------------------------------------------

        const [bookRows] = await pool.execute(
            `
            SELECT
                b.id,
                b.open_library_key,
                b.title,
                b.subtitle,
                b.isbn10,
                b.isbn13,
                b.publisher,
                b.publish_date,
                b.first_publish_year,
                b.language,
                b.cover_url,
                b.page_count,
                b.data_source,
                b.data_quality_score,
                b.created_at,
                b.updated_at
            FROM books b
            WHERE b.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        // ---------------------------------------------
        // BOOK NOT FOUND
        // ---------------------------------------------

        if (bookRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        const book = bookRows[0];

        // ---------------------------------------------
        // GET AUTHORS
        // ---------------------------------------------

        const [authorRows] = await pool.execute(
            `
            SELECT
                a.id,
                a.name
            FROM book_authors ba
            INNER JOIN authors a
                ON a.id = ba.author_id
            WHERE ba.book_id = ?
            ORDER BY a.name ASC
            `,
            [Number(id)]
        );

        // ---------------------------------------------
        // GET SUBJECTS
        // ---------------------------------------------

        const [subjectRows] = await pool.execute(
            `
            SELECT
                s.id,
                s.name
            FROM book_subjects bs
            INNER JOIN subjects s
                ON s.id = bs.subject_id
            WHERE bs.book_id = ?
            ORDER BY s.name ASC
            `,
            [Number(id)]
        );

        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Book details fetched successfully",

            data: {
                ...book,

                authors: authorRows,

                subjects: subjectRows,

                isbns: {
                    isbn10: book.isbn10,
                    isbn13: book.isbn13
                },

                import_source: book.data_source
            }
        });

    } catch (error) {

        console.error(
            "GET BOOK DETAILS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch book details"
        });
    }
};

// =====================================================
// UPDATE BOOK LOCAL FIELDS
// PATCH /api/books/:id
// =====================================================

export const updateBookLocalFields = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            notes,
            featured,
            internal_category
        } = req.body;

        // ---------------------------------------------
        // VALIDATE BOOK ID
        // ---------------------------------------------

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid book ID"
            });
        }

        const bookId = Number(id);

        // ---------------------------------------------
        // CHECK BOOK EXISTS
        // ---------------------------------------------

        const [bookRows] = await pool.execute(
            `
            SELECT id
            FROM books
            WHERE id = ?
            LIMIT 1
            `,
            [bookId]
        );

        if (bookRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        // ---------------------------------------------
        // VALIDATE FEATURED
        // ---------------------------------------------

        let featuredValue;

        if (featured !== undefined) {

            if (
                featured !== true &&
                featured !== false &&
                featured !== 0 &&
                featured !== 1
            ) {
                return res.status(400).json({
                    success: false,
                    message: "featured must be true or false"
                });
            }

            featuredValue =
                featured === true || featured === 1
                    ? 1
                    : 0;
        }

        // ---------------------------------------------
        // VALIDATE NOTES
        // ---------------------------------------------

        if (
            notes !== undefined &&
            notes !== null &&
            typeof notes !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "notes must be a string"
            });
        }

        // ---------------------------------------------
        // VALIDATE INTERNAL CATEGORY
        // ---------------------------------------------

        if (
            internal_category !== undefined &&
            internal_category !== null &&
            typeof internal_category !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "internal_category must be a string"
            });
        }

        // ---------------------------------------------
        // CHECK AT LEAST ONE FIELD
        // ---------------------------------------------

        if (
            notes === undefined &&
            featured === undefined &&
            internal_category === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "At least one local field is required"
            });
        }

        // ---------------------------------------------
        // BUILD UPDATE QUERY
        // ---------------------------------------------

        const updateFields = [];
        const updateValues = [];

        if (notes !== undefined) {
            updateFields.push("notes = ?");
            updateValues.push(notes);
        }

        if (featured !== undefined) {
            updateFields.push("featured = ?");
            updateValues.push(featuredValue);
        }

        if (internal_category !== undefined) {
            updateFields.push(
                "internal_category = ?"
            );

            updateValues.push(
                internal_category
            );
        }

        updateValues.push(bookId);

        // ---------------------------------------------
        // UPDATE
        // ---------------------------------------------

        await pool.execute(
            `
            UPDATE books
            SET ${updateFields.join(", ")}
            WHERE id = ?
            `,
            updateValues
        );

        // ---------------------------------------------
        // GET UPDATED BOOK
        // ---------------------------------------------

        const [updatedRows] = await pool.execute(
            `
            SELECT
                id,
                title,
                notes,
                featured,
                internal_category,
                updated_at
            FROM books
            WHERE id = ?
            LIMIT 1
            `,
            [bookId]
        );

        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        return res.status(200).json({
            success: true,
            message:
                "Book local fields updated successfully",
            data: updatedRows[0]
        });

    } catch (error) {

        console.error(
            "UPDATE BOOK LOCAL FIELDS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update book local fields"
        });
    }
};


// DATA QUALITY DASHBOARD
// GET /api/data-quality
export const getDataQualityDashboard = async (req, res) => {
    try {

        // =====================================================
        // SUMMARY
        // =====================================================

        const [summaryRows] = await pool.execute(`
            SELECT
                COUNT(*) AS totalBooks,

                ROUND(
                    COALESCE(
                        AVG(data_quality_score),
                        0
                    ),
                    2
                ) AS averageQualityScore,

                SUM(
                    CASE
                        WHEN data_quality_score >= 80
                        THEN 1
                        ELSE 0
                    END
                ) AS highQualityBooks,

                SUM(
                    CASE
                        WHEN data_quality_score >= 50
                        AND data_quality_score < 80
                        THEN 1
                        ELSE 0
                    END
                ) AS mediumQualityBooks,

                SUM(
                    CASE
                        WHEN data_quality_score < 50
                        OR data_quality_score IS NULL
                        THEN 1
                        ELSE 0
                    END
                ) AS lowQualityBooks

            FROM books
        `);


        // =====================================================
        // MISSING DATA
        // =====================================================

        const [missingRows] = await pool.execute(`
            SELECT

                SUM(
                    CASE
                        WHEN NOT EXISTS (
                            SELECT 1
                            FROM book_authors ba
                            WHERE ba.book_id = b.id
                        )
                        THEN 1
                        ELSE 0
                    END
                ) AS missingAuthor,

                SUM(
                    CASE
                        WHEN b.first_publish_year IS NULL
                        THEN 1
                        ELSE 0
                    END
                ) AS missingPublishYear,

                SUM(
                    CASE
                        WHEN b.isbn10 IS NULL
                        AND b.isbn13 IS NULL
                        THEN 1
                        ELSE 0
                    END
                ) AS missingISBN,

                SUM(
                    CASE
                        WHEN b.publisher IS NULL
                        OR TRIM(b.publisher) = ''
                        THEN 1
                        ELSE 0
                    END
                ) AS missingPublisher,

                SUM(
                    CASE
                        WHEN b.language IS NULL
                        OR TRIM(b.language) = ''
                        THEN 1
                        ELSE 0
                    END
                ) AS missingLanguage,

                SUM(
                    CASE
                        WHEN b.page_count IS NULL
                        THEN 1
                        ELSE 0
                    END
                ) AS missingPageCount,

                SUM(
                    CASE
                        WHEN b.cover_url IS NULL
                        OR TRIM(b.cover_url) = ''
                        THEN 1
                        ELSE 0
                    END
                ) AS missingCover,

                SUM(
                    CASE
                        WHEN NOT EXISTS (
                            SELECT 1
                            FROM book_subjects bs
                            WHERE bs.book_id = b.id
                        )
                        THEN 1
                        ELSE 0
                    END
                ) AS missingSubjects

            FROM books b
        `);


        // =====================================================
        // POSSIBLE DUPLICATE ISBN-10
        // =====================================================

        const [duplicateISBN10] = await pool.execute(`
            SELECT
                isbn10,
                COUNT(*) AS count
            FROM books
            WHERE
                isbn10 IS NOT NULL
                AND TRIM(isbn10) <> ''
            GROUP BY isbn10
            HAVING COUNT(*) > 1
            ORDER BY count DESC
        `);


        // =====================================================
        // POSSIBLE DUPLICATE ISBN-13
        // =====================================================

        const [duplicateISBN13] = await pool.execute(`
            SELECT
                isbn13,
                COUNT(*) AS count
            FROM books
            WHERE
                isbn13 IS NOT NULL
                AND TRIM(isbn13) <> ''
            GROUP BY isbn13
            HAVING COUNT(*) > 1
            ORDER BY count DESC
        `);


        // =====================================================
        // REVIEW STATUS
        // =====================================================

        const [reviewRows] = await pool.execute(`
            SELECT

                COUNT(*) AS totalBooks,

                SUM(
                    CASE
                        WHEN reviewed = 1
                        THEN 1
                        ELSE 0
                    END
                ) AS reviewedBooks,

                SUM(
                    CASE
                        WHEN reviewed = 0
                        THEN 1
                        ELSE 0
                    END
                ) AS pendingReviewBooks

            FROM books
        `);


        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({

            success: true,

            message:
                "Data quality dashboard fetched successfully",

            data: {

                summary: {

                    totalBooks:
                        Number(
                            summaryRows[0]?.totalBooks || 0
                        ),

                    averageQualityScore:
                        Number(
                            summaryRows[0]?.averageQualityScore || 0
                        ),

                    highQualityBooks:
                        Number(
                            summaryRows[0]?.highQualityBooks || 0
                        ),

                    mediumQualityBooks:
                        Number(
                            summaryRows[0]?.mediumQualityBooks || 0
                        ),

                    lowQualityBooks:
                        Number(
                            summaryRows[0]?.lowQualityBooks || 0
                        )
                },


                missingData: {

                    author:
                        Number(
                            missingRows[0]?.missingAuthor || 0
                        ),

                    publishYear:
                        Number(
                            missingRows[0]?.missingPublishYear || 0
                        ),

                    subjects:
                        Number(
                            missingRows[0]?.missingSubjects || 0
                        ),

                    isbn:
                        Number(
                            missingRows[0]?.missingISBN || 0
                        ),

                    publisher:
                        Number(
                            missingRows[0]?.missingPublisher || 0
                        ),

                    language:
                        Number(
                            missingRows[0]?.missingLanguage || 0
                        ),

                    pageCount:
                        Number(
                            missingRows[0]?.missingPageCount || 0
                        ),

                    cover:
                        Number(
                            missingRows[0]?.missingCover || 0
                        )
                },


                duplicateISBN: {

                    isbn10: duplicateISBN10,

                    isbn13: duplicateISBN13,

                    totalGroups:
                        duplicateISBN10.length +
                        duplicateISBN13.length
                },


                review: {

                    totalBooks:
                        Number(
                            reviewRows[0]?.totalBooks || 0
                        ),

                    reviewedBooks:
                        Number(
                            reviewRows[0]?.reviewedBooks || 0
                        ),

                    pendingReviewBooks:
                        Number(
                            reviewRows[0]?.pendingReviewBooks || 0
                        )
                }
            }
        });

    } catch (error) {

        console.error(
            "GET DATA QUALITY DASHBOARD ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch data quality dashboard",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined
        });
    }
};


export const markBookAsReviewed = async (req, res) => {

    try {

        const bookId =
            Number(req.params.id);

        if (
            !Number.isInteger(bookId) ||
            bookId < 1
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid book ID"
            });
        }


        const [result] =
            await pool.execute(
                `
                UPDATE books
                SET reviewed = 1
                WHERE id = ?
                `,
                [bookId]
            );


        if (result.affectedRows === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Book not found"
            });
        }


        return res.status(200).json({

            success: true,

            message:
                "Book marked as reviewed successfully",

            data: {

                bookId,

                reviewed: true
            }
        });

    } catch (error) {

        console.error(
            "MARK BOOK REVIEWED ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to mark book as reviewed"
        });
    }
};

// =====================================================
// STEP 15.6 — DATA QUALITY BOOK DETAILS
// GET /api/data-quality/books/:id
// =====================================================

export const getDataQualityBookDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        // -------------------------------------------------
        // VALIDATE BOOK ID
        // -------------------------------------------------

        const bookId = parseInt(id, 10);

        if (!Number.isInteger(bookId) || bookId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid book ID"
            });
        }

        // -------------------------------------------------
        // GET BOOK + QUALITY INFORMATION
        // -------------------------------------------------

        const [books] = await pool.execute(
            `
            SELECT
                id,
                open_library_key,
                title,
                subtitle,
                isbn10,
                isbn13,
                publisher,
                language,
                page_count,
                cover_url,
                first_publish_year,
                data_quality_score,
                data_source,
                created_at,
                updated_at
            FROM books
            WHERE id = ?
            LIMIT 1
            `,
            [bookId]
        );

        // -------------------------------------------------
        // BOOK NOT FOUND
        // -------------------------------------------------

        if (books.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        const book = books[0];

        // -------------------------------------------------
        // CHECK MISSING FIELDS
        // -------------------------------------------------

        const missing = {
            isbn10:
                book.isbn10 === null ||
                String(book.isbn10).trim() === "",

            isbn13:
                book.isbn13 === null ||
                String(book.isbn13).trim() === "",

            publisher:
                book.publisher === null ||
                String(book.publisher).trim() === "",

            language:
                book.language === null ||
                String(book.language).trim() === "" ||
                book.language === "und",

            pageCount:
                book.page_count === null ||
                Number(book.page_count) <= 0,

            cover:
                book.cover_url === null ||
                String(book.cover_url).trim() === "",

            publishYear:
                book.first_publish_year === null ||
                Number(book.first_publish_year) <= 0
        };

        // -------------------------------------------------
        // MISSING FIELD COUNT
        // -------------------------------------------------

        const missingFieldCount =
            Object.values(missing).filter(Boolean).length;

        // -------------------------------------------------
        // QUALITY STATUS
        // -------------------------------------------------

        const qualityScore =
            Number(book.data_quality_score || 0);

        let qualityStatus;

        if (qualityScore >= 80) {
            qualityStatus = "high";
        } else if (qualityScore >= 50) {
            qualityStatus = "medium";
        } else {
            qualityStatus = "low";
        }

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Data quality book details fetched successfully",

            data: {
                book: {
                    id: book.id,
                    open_library_key:
                        book.open_library_key,
                    title: book.title,
                    subtitle: book.subtitle,
                    isbn10: book.isbn10,
                    isbn13: book.isbn13,
                    publisher: book.publisher,
                    language: book.language,
                    page_count: book.page_count,
                    cover_url: book.cover_url,
                    first_publish_year:
                        book.first_publish_year,
                    data_source: book.data_source,
                    created_at: book.created_at,
                    updated_at: book.updated_at
                },

                quality: {
                    score: qualityScore,
                    status: qualityStatus,
                    missingFieldCount,

                    missing: {
                        isbn10: missing.isbn10,
                        isbn13: missing.isbn13,
                        publisher: missing.publisher,
                        language: missing.language,
                        pageCount: missing.pageCount,
                        cover: missing.cover,
                        publishYear: missing.publishYear
                    }
                }
            }
        });

    } catch (error) {
        console.error(
            "GET DATA QUALITY BOOK DETAILS ERROR:",
            error
        );

        next(error);
    }
};

// STEP 15.3 — RECALCULATE DATA QUALITY
// POST /api/data-quality/recalculate
export const recalculateDataQuality = async (req, res) => {
    try {
        // -------------------------------------------------
        // GET ALL BOOKS
        // -------------------------------------------------

        const [books] = await pool.execute(`
            SELECT
                id,
                isbn10,
                isbn13,
                publisher,
                language,
                page_count,
                cover_url,
                first_publish_year
            FROM books
        `);

        if (books.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No books found to recalculate",
                data: {
                    totalBooks: 0,
                    updatedBooks: 0
                }
            });
        }

        let updatedBooks = 0;

        // -------------------------------------------------
        // CALCULATE QUALITY SCORE
        // -------------------------------------------------

        for (const book of books) {
            let score = 0;

            // ISBN-10 = 15 points
            if (
                book.isbn10 &&
                String(book.isbn10).trim() !== ""
            ) {
                score += 15;
            }

            // ISBN-13 = 15 points
            if (
                book.isbn13 &&
                String(book.isbn13).trim() !== ""
            ) {
                score += 15;
            }

            // Publisher = 15 points
            if (
                book.publisher &&
                String(book.publisher).trim() !== ""
            ) {
                score += 15;
            }

            // Language = 10 points
            if (
                book.language &&
                String(book.language).trim() !== "" &&
                book.language !== "und"
            ) {
                score += 10;
            }

            // Page count = 15 points
            if (
                book.page_count !== null &&
                Number(book.page_count) > 0
            ) {
                score += 15;
            }

            // Cover = 15 points
            if (
                book.cover_url &&
                String(book.cover_url).trim() !== ""
            ) {
                score += 15;
            }

            // Publish year = 15 points
            if (
                book.first_publish_year !== null &&
                Number(book.first_publish_year) > 0
            ) {
                score += 15;
            }

            // -------------------------------------------------
            // UPDATE BOOK SCORE
            // -------------------------------------------------

            await pool.execute(
                `
                UPDATE books
                SET
                    data_quality_score = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                `,
                [
                    score,
                    book.id
                ]
            );

            updatedBooks++;
        }

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Data quality scores recalculated successfully",

            data: {
                totalBooks: books.length,
                updatedBooks
            }
        });

    } catch (error) {
        console.error(
            "RECALCULATE DATA QUALITY ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to recalculate data quality scores"
        });
    }
};

// STEP 15.4 — DATA QUALITY ISSUE SUMMARY
// GET /api/data-quality/issue-summary
export const getDataQualityIssueSummary = async (req, res) => {
    try {
        // -------------------------------------------------
        // GET MISSING DATA COUNTS
        // -------------------------------------------------

        const [rows] = await pool.execute(`
            SELECT

                SUM(
                    CASE
                        WHEN isbn10 IS NULL
                        OR TRIM(isbn10) = ''
                        THEN 1
                        ELSE 0
                    END
                ) AS isbn10,

                SUM(
                    CASE
                        WHEN isbn13 IS NULL
                        OR TRIM(isbn13) = ''
                        THEN 1
                        ELSE 0
                    END
                ) AS isbn13,

                SUM(
                    CASE
                        WHEN publisher IS NULL
                        OR TRIM(publisher) = ''
                        THEN 1
                        ELSE 0
                    END
                ) AS publisher,

                SUM(
                    CASE
                        WHEN language IS NULL
                        OR TRIM(language) = ''
                        OR language = 'und'
                        THEN 1
                        ELSE 0
                    END
                ) AS language,

                SUM(
                    CASE
                        WHEN page_count IS NULL
                        OR page_count <= 0
                        THEN 1
                        ELSE 0
                    END
                ) AS page_count,

                SUM(
                    CASE
                        WHEN cover_url IS NULL
                        OR TRIM(cover_url) = ''
                        THEN 1
                        ELSE 0
                    END
                ) AS cover,

                SUM(
                    CASE
                        WHEN first_publish_year IS NULL
                        OR first_publish_year <= 0
                        THEN 1
                        ELSE 0
                    END
                ) AS publish_year

            FROM books
        `);

        const result = rows[0];

        // -------------------------------------------------
        // BUILD ISSUE SUMMARY
        // -------------------------------------------------

        const issues = [
            {
                field: "isbn10",
                label: "ISBN-10",
                missingCount: Number(result.isbn10 || 0)
            },
            {
                field: "isbn13",
                label: "ISBN-13",
                missingCount: Number(result.isbn13 || 0)
            },
            {
                field: "publisher",
                label: "Publisher",
                missingCount: Number(result.publisher || 0)
            },
            {
                field: "language",
                label: "Language",
                missingCount: Number(result.language || 0)
            },
            {
                field: "page_count",
                label: "Page Count",
                missingCount: Number(result.page_count || 0)
            },
            {
                field: "cover",
                label: "Cover",
                missingCount: Number(result.cover || 0)
            },
            {
                field: "publish_year",
                label: "Publish Year",
                missingCount: Number(result.publish_year || 0)
            }
        ];

        // -------------------------------------------------
        // SORT BY MOST ISSUES
        // -------------------------------------------------

        issues.sort(
            (a, b) =>
                b.missingCount - a.missingCount
        );

        // -------------------------------------------------
        // TOTAL ISSUE COUNT
        // -------------------------------------------------

        const totalMissingValues =
            issues.reduce(
                (total, issue) =>
                    total + issue.missingCount,
                0
            );

        // -------------------------------------------------
        // MOST COMMON ISSUE
        // -------------------------------------------------

        const topIssue =
            issues.length > 0 &&
            issues[0].missingCount > 0
                ? issues[0]
                : null;

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Data quality issue summary fetched successfully",

            data: {
                totalMissingValues,

                issueCount:
                    issues.filter(
                        issue =>
                            issue.missingCount > 0
                    ).length,

                topIssue,

                issues
            }
        });

    } catch (error) {
        console.error(
            "GET DATA QUALITY ISSUE SUMMARY ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch data quality issue summary"
        });
    }
};

// =====================================================
// STEP 15.5 — DATA QUALITY FILTER API
// GET /api/data-quality/books
//
// Examples:
// GET /api/data-quality/books?quality=high
// GET /api/data-quality/books?quality=medium
// GET /api/data-quality/books?quality=low
// GET /api/data-quality/books?quality=high&search=money
// GET /api/data-quality/books?page=2&limit=20
// =====================================================

export const getDataQualityBooks = async (req, res) => {
    try {
        const {
            quality = "",
            search = "",
            page = 1,
            limit = 20
        } = req.query;

        // -------------------------------------------------
        // PAGINATION
        // -------------------------------------------------

        const currentPage = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const pageLimit = Math.min(
            Math.max(
                parseInt(limit, 10) || 20,
                1
            ),
            100
        );

        const offset =
            (currentPage - 1) * pageLimit;

        // -------------------------------------------------
        // QUALITY FILTER
        // -------------------------------------------------

        const qualityValue =
            String(quality).trim().toLowerCase();

        const allowedQuality = [
            "high",
            "medium",
            "low"
        ];

        if (
            qualityValue &&
            !allowedQuality.includes(qualityValue)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid quality filter. Use high, medium, or low"
            });
        }

        // -------------------------------------------------
        // BUILD WHERE CONDITION
        // -------------------------------------------------

        const conditions = [];
        const queryParams = [];

        // Quality condition

        if (qualityValue === "high") {
            conditions.push(`
                data_quality_score >= 80
            `);
        }

        if (qualityValue === "medium") {
            conditions.push(`
                data_quality_score >= 50
                AND data_quality_score < 80
            `);
        }

        if (qualityValue === "low") {
            conditions.push(`
                (
                    data_quality_score < 50
                    OR data_quality_score IS NULL
                )
            `);
        }

        // Search condition

        const searchValue =
            String(search).trim();

        if (searchValue) {
            conditions.push(`
                (
                    title LIKE ?
                    OR subtitle LIKE ?
                    OR open_library_key LIKE ?
                )
            `);

            const searchPattern =
                `%${searchValue}%`;

            queryParams.push(
                searchPattern,
                searchPattern,
                searchPattern
            );
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        // -------------------------------------------------
        // COUNT BOOKS
        // -------------------------------------------------

        const [countRows] =
            await pool.execute(
                `
                SELECT COUNT(*) AS total
                FROM books
                ${whereClause}
                `,
                queryParams
            );

        const total =
            Number(countRows[0]?.total || 0);

        // -------------------------------------------------
        // GET BOOKS
        // -------------------------------------------------

        const [books] =
            await pool.execute(
                `
                SELECT
                    id,
                    open_library_key,
                    title,
                    subtitle,
                    isbn10,
                    isbn13,
                    publisher,
                    language,
                    page_count,
                    cover_url,
                    first_publish_year,
                    data_quality_score,
                    data_source,
                    created_at,
                    updated_at,

                    CASE
                        WHEN isbn10 IS NULL
                        OR TRIM(isbn10) = ''
                        THEN 1
                        ELSE 0
                    END AS missing_isbn10,

                    CASE
                        WHEN isbn13 IS NULL
                        OR TRIM(isbn13) = ''
                        THEN 1
                        ELSE 0
                    END AS missing_isbn13,

                    CASE
                        WHEN publisher IS NULL
                        OR TRIM(publisher) = ''
                        THEN 1
                        ELSE 0
                    END AS missing_publisher,

                    CASE
                        WHEN language IS NULL
                        OR TRIM(language) = ''
                        OR language = 'und'
                        THEN 1
                        ELSE 0
                    END AS missing_language,

                    CASE
                        WHEN page_count IS NULL
                        OR page_count <= 0
                        THEN 1
                        ELSE 0
                    END AS missing_page_count,

                    CASE
                        WHEN cover_url IS NULL
                        OR TRIM(cover_url) = ''
                        THEN 1
                        ELSE 0
                    END AS missing_cover,

                    CASE
                        WHEN first_publish_year IS NULL
                        OR first_publish_year <= 0
                        THEN 1
                        ELSE 0
                    END AS missing_publish_year

                FROM books

                ${whereClause}

                ORDER BY
                    data_quality_score ASC,
                    title ASC

                LIMIT ? OFFSET ?
                `,
                [
                    ...queryParams,
                    pageLimit,
                    offset
                ]
            );

        // -------------------------------------------------
        // PAGINATION
        // -------------------------------------------------

        const totalPages =
            Math.ceil(
                total / pageLimit
            );

        const hasNextPage =
            currentPage < totalPages;

        const hasPreviousPage =
            currentPage > 1;

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Data quality books fetched successfully",

            data: {
                books,

                filters: {
                    quality:
                        qualityValue || null,

                    search:
                        searchValue || null
                },

                pagination: {
                    page: currentPage,
                    limit: pageLimit,
                    total,
                    totalPages,

                    hasNextPage,
                    hasPreviousPage,

                    nextPage:
                        hasNextPage
                            ? currentPage + 1
                            : null,

                    previousPage:
                        hasPreviousPage
                            ? currentPage - 1
                            : null
                }
            }
        });

    } catch (error) {
        console.error(
            "GET DATA QUALITY BOOKS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch data quality books"
        });
    }
};

// DATA QUALITY ISSUES
// STEP 15.2
// GET /api/data-quality/issues
export const getDataQualityIssues = async (req, res) => {
    try {
        // =================================================
        // PAGINATION
        // =================================================

        let page = Number(req.query.page) || 1;
        let limit = Number(req.query.limit) || 20;

        if (page < 1) {
            page = 1;
        }

        if (limit < 1) {
            limit = 20;
        }

        if (limit > 100) {
            limit = 100;
        }

        const offset = (page - 1) * limit;

        // =================================================
        // ISSUE FILTER
        // =================================================

        const issue =
            typeof req.query.issue === "string"
                ? req.query.issue.trim().toLowerCase()
                : "";

        const allowedIssues = [
            "isbn10",
            "isbn13",
            "publisher",
            "language",
            "page_count",
            "cover",
            "publish_year",
            "low_quality"
        ];

        if (
            issue &&
            !allowedIssues.includes(issue)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid issue type",
                allowedIssues
            });
        }

        // =================================================
        // BUILD CONDITIONS
        // =================================================

        const conditions = [];

        // =================================================
        // ALL ISSUES
        // =================================================

        if (!issue) {
            conditions.push(`
                (
                    b.isbn10 IS NULL
                    OR TRIM(b.isbn10) = ''

                    OR b.isbn13 IS NULL
                    OR TRIM(b.isbn13) = ''

                    OR b.publisher IS NULL
                    OR TRIM(b.publisher) = ''

                    OR b.language IS NULL
                    OR TRIM(b.language) = ''
                    OR b.language = 'und'

                    OR b.page_count IS NULL
                    OR b.page_count <= 0

                    OR b.cover_url IS NULL
                    OR TRIM(b.cover_url) = ''

                    OR b.first_publish_year IS NULL
                    OR b.first_publish_year <= 0

                    OR b.data_quality_score IS NULL
                    OR b.data_quality_score < 50
                )
            `);
        }

        // =================================================
        // ISBN-10
        // =================================================

        if (issue === "isbn10") {
            conditions.push(`
                (
                    b.isbn10 IS NULL
                    OR TRIM(b.isbn10) = ''
                )
            `);
        }

        // =================================================
        // ISBN-13
        // =================================================

        if (issue === "isbn13") {
            conditions.push(`
                (
                    b.isbn13 IS NULL
                    OR TRIM(b.isbn13) = ''
                )
            `);
        }

        // =================================================
        // PUBLISHER
        // =================================================

        if (issue === "publisher") {
            conditions.push(`
                (
                    b.publisher IS NULL
                    OR TRIM(b.publisher) = ''
                )
            `);
        }

        // =================================================
        // LANGUAGE
        // =================================================

        if (issue === "language") {
            conditions.push(`
                (
                    b.language IS NULL
                    OR TRIM(b.language) = ''
                    OR b.language = 'und'
                )
            `);
        }

        // =================================================
        // PAGE COUNT
        // =================================================

        if (issue === "page_count") {
            conditions.push(`
                (
                    b.page_count IS NULL
                    OR b.page_count <= 0
                )
            `);
        }

        // =================================================
        // COVER
        // =================================================

        if (issue === "cover") {
            conditions.push(`
                (
                    b.cover_url IS NULL
                    OR TRIM(b.cover_url) = ''
                )
            `);
        }

        // =================================================
        // PUBLISH YEAR
        // =================================================

        if (issue === "publish_year") {
            conditions.push(`
                (
                    b.first_publish_year IS NULL
                    OR b.first_publish_year <= 0
                )
            `);
        }

        // =================================================
        // LOW QUALITY
        // =================================================

        if (issue === "low_quality") {
            conditions.push(`
                (
                    b.data_quality_score IS NULL
                    OR b.data_quality_score < 50
                )
            `);
        }

        // =================================================
        // WHERE
        // =================================================

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        // =================================================
        // COUNT
        // =================================================

        const [countRows] =
            await pool.execute(
                `
                SELECT COUNT(*) AS total
                FROM books b
                ${whereClause}
                `
            );

        const total =
            Number(countRows[0]?.total || 0);

        // =================================================
        // GET BOOKS WITH ISSUES
        // =================================================

        const [books] =
            await pool.execute(
                `
                SELECT
                    b.id,
                    b.open_library_key,
                    b.title,
                    b.subtitle,
                    b.isbn10,
                    b.isbn13,
                    b.publisher,
                    b.language,
                    b.page_count,
                    b.first_publish_year,
                    b.cover_url,
                    b.data_quality_score,
                    b.data_source,
                    b.created_at,
                    b.updated_at,

                    CASE
                        WHEN
                            b.isbn10 IS NULL
                            OR TRIM(b.isbn10) = ''
                        THEN 1
                        ELSE 0
                    END AS missing_isbn10,

                    CASE
                        WHEN
                            b.isbn13 IS NULL
                            OR TRIM(b.isbn13) = ''
                        THEN 1
                        ELSE 0
                    END AS missing_isbn13,

                    CASE
                        WHEN
                            b.publisher IS NULL
                            OR TRIM(b.publisher) = ''
                        THEN 1
                        ELSE 0
                    END AS missing_publisher,

                    CASE
                        WHEN
                            b.language IS NULL
                            OR TRIM(b.language) = ''
                            OR b.language = 'und'
                        THEN 1
                        ELSE 0
                    END AS missing_language,

                    CASE
                        WHEN
                            b.page_count IS NULL
                            OR b.page_count <= 0
                        THEN 1
                        ELSE 0
                    END AS missing_page_count,

                    CASE
                        WHEN
                            b.cover_url IS NULL
                            OR TRIM(b.cover_url) = ''
                        THEN 1
                        ELSE 0
                    END AS missing_cover,

                    CASE
                        WHEN
                            b.first_publish_year IS NULL
                            OR b.first_publish_year <= 0
                        THEN 1
                        ELSE 0
                    END AS missing_publish_year,

                    CASE
                        WHEN
                            b.data_quality_score IS NULL
                            OR b.data_quality_score < 50
                        THEN 1
                        ELSE 0
                    END AS low_quality

                FROM books b

                ${whereClause}

                ORDER BY
                    b.data_quality_score ASC,
                    b.id DESC

                LIMIT ${limit}
                OFFSET ${offset}
                `
            );

        // =================================================
        // PAGINATION
        // =================================================

        const totalPages =
            total === 0
                ? 0
                : Math.ceil(total / limit);

        const hasNextPage =
            page < totalPages;

        const hasPreviousPage =
            page > 1 &&
            totalPages > 0;

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,

            message:
                "Data quality issues fetched successfully",

            data: {
                books,

                issue:
                    issue || "all",

                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,

                    hasNextPage,
                    hasPreviousPage,

                    nextPage:
                        hasNextPage
                            ? page + 1
                            : null,

                    previousPage:
                        hasPreviousPage
                            ? page - 1
                            : null
                }
            }
        });

    } catch (error) {

        console.error(
            "GET DATA QUALITY ISSUES ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch data quality issues"
        });
    }
};


// =====================================================
// GET ALL BOOKS
// GET /api/books
// =====================================================

export const getAllBooks = async (req, res) => {
    try {

        const [books] = await pool.execute(`
            SELECT
                id,
                open_library_key,
                title,
                subtitle,
                isbn10,
                isbn13,
                publisher,
                publish_date,
                first_publish_year,
                language,
                description,
                cover_url,
                page_count,
                data_source,
                created_at,
                updated_at
            FROM books
            ORDER BY id DESC
        `);

        return res.status(200).json({
            success: true,
            message: "Books fetched successfully",
            count: books.length,
            data: books
        });

    } catch (error) {

        console.error(
            "GET ALL BOOKS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch books"
        });
    }
};


// =====================================================
// GET BOOK BY ID
// GET /api/books/:id
// =====================================================
export const getBookById = async (req, res) => {
    try {

        const {
            id
        } = req.params;

        // =================================================
        // VALIDATE ID
        // =================================================

        const bookId = Number(id);

        if (
            !Number.isInteger(bookId) ||
            bookId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid book ID"
            });
        }

        // =================================================
        // GET BOOK
        // =================================================

        const [bookRows] = await pool.execute(
            `
            SELECT
                id,
                open_library_key,
                title,
                subtitle,
                isbn10,
                isbn13,
                publisher,
                publish_date,
                first_publish_year,
                language,
                description,
                cover_url,
                page_count,
                data_source,
                created_at,
                updated_at
            FROM books
            WHERE id = ?
            LIMIT 1
            `,
            [bookId]
        );

        // =================================================
        // BOOK NOT FOUND
        // =================================================

        if (bookRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        const book = bookRows[0];

        // =================================================
        // GET AUTHORS
        // =================================================

        const [authorRows] = await pool.execute(
            `
            SELECT
                a.id,
                a.name,
                a.open_library_key
            FROM authors a
            INNER JOIN book_authors ba
                ON ba.author_id = a.id
            WHERE ba.book_id = ?
            ORDER BY a.name ASC
            `,
            [bookId]
        );

        // =================================================
        // GET SUBJECTS
        // =================================================

        const [subjectRows] = await pool.execute(
            `
            SELECT
                s.id,
                s.name
            FROM subjects s
            INNER JOIN book_subjects bs
                ON bs.subject_id = s.id
            WHERE bs.book_id = ?
            ORDER BY s.name ASC
            `,
            [bookId]
        );

        // =================================================
        // FINAL RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,
            message: "Book fetched successfully",
            data: {
                ...book,
                authors: authorRows,
                subjects: subjectRows
            }
        });

    } catch (error) {

        console.error(
            "GET BOOK BY ID ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch book"
        });
    }
};

// =====================================================
// CREATE BOOK
// POST /api/books
// STEP 12.3 + STEP 12.6 — CREATE + VALIDATION
// =====================================================
export const createBook = async (req, res) => {

    const connection =
        await pool.getConnection();

    try {

        // =================================================
        // VALIDATE BOOK
        // =================================================

        const validation =
            validateBook(req.body);

        if (!validation.valid) {

            return res.status(400).json({

                success: false,

                message:
                    "Book validation failed",

                errors:
                    validation.errors
            });
        }

        // =================================================
        // GET VALIDATED DATA
        // =================================================

        const book =
            validation.book;

        const {
            open_library_key,
            title,
            subtitle,
            isbn10,
            isbn13,
            publisher,
            publish_date,
            first_publish_year,
            language,
            description,
            cover_url,
            page_count,
            data_source,
            authors,
            subjects
        } = book;


        // =================================================
        // START TRANSACTION
        // =================================================

        await connection.beginTransaction();


        // =================================================
        // DUPLICATE CHECK
        // =================================================

        const duplicateConditions = [];
        const duplicateValues = [];


        // -------------------------------------------------
        // OPEN LIBRARY KEY
        // -------------------------------------------------

        if (open_library_key) {

            duplicateConditions.push(
                "open_library_key = ?"
            );

            duplicateValues.push(
                open_library_key
            );
        }


        // -------------------------------------------------
        // ISBN-10
        // -------------------------------------------------

        if (isbn10) {

            duplicateConditions.push(
                "isbn10 = ?"
            );

            duplicateValues.push(
                isbn10
            );
        }


        // -------------------------------------------------
        // ISBN-13
        // -------------------------------------------------

        if (isbn13) {

            duplicateConditions.push(
                "isbn13 = ?"
            );

            duplicateValues.push(
                isbn13
            );
        }


        // =================================================
        // CHECK EXISTING BOOK
        // =================================================

        if (
            duplicateConditions.length > 0
        ) {

            const [
                existingBooks
            ] =
                await connection.execute(
                    `
                    SELECT
                        id,
                        title,
                        open_library_key,
                        isbn10,
                        isbn13
                    FROM books
                    WHERE
                        ${duplicateConditions.join(
                            " OR "
                        )}
                    LIMIT 1
                    `,
                    duplicateValues
                );


            if (
                existingBooks.length > 0
            ) {

                await connection.rollback();

                return res.status(409).json({

                    success: false,

                    message:
                        "Book already exists",

                    data:
                        existingBooks[0]
                });
            }
        }


        // =================================================
        // INSERT BOOK
        // =================================================

        const [
            result
        ] =
            await connection.execute(
                `
                INSERT INTO books
                (
                    open_library_key,
                    title,
                    subtitle,
                    isbn10,
                    isbn13,
                    publisher,
                    publish_date,
                    first_publish_year,
                    language,
                    description,
                    cover_url,
                    page_count,
                    data_source
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    open_library_key,
                    title,
                    subtitle,
                    isbn10,
                    isbn13,
                    publisher,
                    publish_date,
                    first_publish_year,
                    language,
                    description,
                    cover_url,
                    page_count,
                    data_source
                ]
            );


        const bookId =
            result.insertId;


        // =================================================
        // INSERT AUTHORS
        // =================================================

        for (
            const authorName of authors
        ) {

            // ---------------------------------------------
            // FIND AUTHOR
            // ---------------------------------------------

            const [
                existingAuthors
            ] =
                await connection.execute(
                    `
                    SELECT
                        id
                    FROM authors
                    WHERE name = ?
                    LIMIT 1
                    `,
                    [
                        authorName
                    ]
                );


            let authorId;


            // ---------------------------------------------
            // EXISTING AUTHOR
            // ---------------------------------------------

            if (
                existingAuthors.length > 0
            ) {

                authorId =
                    existingAuthors[0].id;

            }


            // ---------------------------------------------
            // CREATE AUTHOR
            // ---------------------------------------------

            else {

                const [
                    authorResult
                ] =
                    await connection.execute(
                        `
                        INSERT INTO authors
                        (
                            name
                        )
                        VALUES (?)
                        `,
                        [
                            authorName
                        ]
                    );


                authorId =
                    authorResult.insertId;
            }


            // ---------------------------------------------
            // BOOK AUTHOR RELATIONSHIP
            // ---------------------------------------------

            await connection.execute(
                `
                INSERT IGNORE INTO book_authors
                (
                    book_id,
                    author_id
                )
                VALUES (?, ?)
                `,
                [
                    bookId,
                    authorId
                ]
            );
        }


        // =================================================
        // INSERT SUBJECTS
        // =================================================

        for (
            const subjectName of subjects
        ) {

            // ---------------------------------------------
            // FIND SUBJECT
            // ---------------------------------------------

            const [
                existingSubjects
            ] =
                await connection.execute(
                    `
                    SELECT
                        id
                    FROM subjects
                    WHERE name = ?
                    LIMIT 1
                    `,
                    [
                        subjectName
                    ]
                );


            let subjectId;


            // ---------------------------------------------
            // EXISTING SUBJECT
            // ---------------------------------------------

            if (
                existingSubjects.length > 0
            ) {

                subjectId =
                    existingSubjects[0].id;

            }


            // ---------------------------------------------
            // CREATE SUBJECT
            // ---------------------------------------------

            else {

                const [
                    subjectResult
                ] =
                    await connection.execute(
                        `
                        INSERT INTO subjects
                        (
                            name
                        )
                        VALUES (?)
                        `,
                        [
                            subjectName
                        ]
                    );


                subjectId =
                    subjectResult.insertId;
            }


            // ---------------------------------------------
            // BOOK SUBJECT RELATIONSHIP
            // ---------------------------------------------

            await connection.execute(
                `
                INSERT IGNORE INTO book_subjects
                (
                    book_id,
                    subject_id
                )
                VALUES (?, ?)
                `,
                [
                    bookId,
                    subjectId
                ]
            );
        }


        // =================================================
        // COMMIT
        // =================================================

        await connection.commit();


        // =================================================
        // GET CREATED BOOK
        // =================================================

        const [
            createdBooks
        ] =
            await connection.execute(
                `
                SELECT
                    id,
                    open_library_key,
                    title,
                    subtitle,
                    isbn10,
                    isbn13,
                    publisher,
                    publish_date,
                    first_publish_year,
                    language,
                    description,
                    cover_url,
                    page_count,
                    data_source,
                    created_at,
                    updated_at
                FROM books
                WHERE id = ?
                LIMIT 1
                `,
                [
                    bookId
                ]
            );


        // =================================================
        // RESPONSE
        // =================================================

        return res.status(201).json({

            success: true,

            message:
                "Book created successfully",

            data: {

                ...createdBooks[0],

                authors,

                subjects
            }
        });


    } catch (error) {

        // =================================================
        // ROLLBACK
        // =================================================

        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error(
                "ROLLBACK ERROR:",
                rollbackError.message
            );
        }


        console.error(
            "CREATE BOOK ERROR:",
            error
        );


        // =================================================
        // DUPLICATE DATABASE ERROR
        // =================================================

        if (
            error.code ===
            "ER_DUP_ENTRY"
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "Book already exists"
            });
        }


        // =================================================
        // SERVER ERROR
        // =================================================

        return res.status(500).json({

            success: false,

            message:
                "Failed to create book"
        });


    } finally {

        connection.release();
    }
};


// =====================================================
// UPDATE BOOK
// PUT /api/books/:id
// STEP 12.4
// =====================================================
export const updateBook = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const { id } = req.params;

        // =================================================
        // VALIDATE BOOK ID
        // =================================================

        const bookId = Number(id);

        if (
            !Number.isInteger(bookId) ||
            bookId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid book ID"
            });

        }

        // =================================================
        // GET REQUEST DATA
        // =================================================

        const {
            open_library_key,
            title,
            subtitle,
            isbn10,
            isbn13,
            publisher,
            publish_date,
            first_publish_year,
            language,
            description,
            cover_url,
            page_count,
            data_source,
            authors,
            subjects
        } = req.body;


        // =================================================
        // CHECK BOOK EXISTS
        // =================================================

        const [existingRows] =
            await connection.execute(
                `
                SELECT
                    id,
                    open_library_key,
                    isbn10,
                    isbn13
                FROM books
                WHERE id = ?
                LIMIT 1
                `,
                [bookId]
            );


        if (existingRows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Book not found"
            });

        }


        // =================================================
        // VALIDATE TITLE
        // =================================================

        if (
            title !== undefined &&
            (
                typeof title !== "string" ||
                !title.trim()
            )
        ) {

            return res.status(400).json({
                success: false,
                message: "Title cannot be empty"
            });

        }


        // =================================================
        // VALIDATE AUTHORS
        // =================================================

        if (
            authors !== undefined &&
            !Array.isArray(authors)
        ) {

            return res.status(400).json({
                success: false,
                message: "Authors must be an array"
            });

        }


        // =================================================
        // VALIDATE SUBJECTS
        // =================================================

        if (
            subjects !== undefined &&
            !Array.isArray(subjects)
        ) {

            return res.status(400).json({
                success: false,
                message: "Subjects must be an array"
            });

        }


        // =================================================
        // CLEAN VALUES
        // =================================================

        const cleanOpenLibraryKey =
            typeof open_library_key === "string" &&
            open_library_key.trim()
                ? open_library_key.trim()
                : null;


        const cleanTitle =
            typeof title === "string"
                ? title.trim()
                : null;


        const cleanSubtitle =
            typeof subtitle === "string" &&
            subtitle.trim()
                ? subtitle.trim()
                : null;


        const cleanIsbn10 =
            typeof isbn10 === "string" &&
            isbn10.trim()
                ? isbn10
                    .replace(/[-\s]/g, "")
                    .trim()
                : null;


        const cleanIsbn13 =
            typeof isbn13 === "string" &&
            isbn13.trim()
                ? isbn13
                    .replace(/[-\s]/g, "")
                    .trim()
                : null;


        const cleanPublisher =
            typeof publisher === "string" &&
            publisher.trim()
                ? publisher.trim()
                : null;


        const cleanPublishDate =
            typeof publish_date === "string" &&
            publish_date.trim()
                ? publish_date.trim()
                : null;


        const cleanLanguage =
            typeof language === "string" &&
            language.trim()
                ? language.trim()
                : null;


        const cleanDescription =
            typeof description === "string" &&
            description.trim()
                ? description.trim()
                : null;


        const cleanCoverUrl =
            typeof cover_url === "string" &&
            cover_url.trim()
                ? cover_url.trim()
                : null;


        const cleanDataSource =
            typeof data_source === "string" &&
            data_source.trim()
                ? data_source.trim()
                : "Manual";


        // =================================================
        // VALIDATE ISBN-10
        // =================================================

        if (
            cleanIsbn10 &&
            !/^\d{10}$/.test(cleanIsbn10)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "ISBN-10 must contain exactly 10 digits"
            });

        }


        // =================================================
        // VALIDATE ISBN-13
        // =================================================

        if (
            cleanIsbn13 &&
            !/^\d{13}$/.test(cleanIsbn13)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "ISBN-13 must contain exactly 13 digits"
            });

        }


        // =================================================
        // VALIDATE PAGE COUNT
        // =================================================

        let cleanPageCount = null;

        if (
            page_count !== undefined &&
            page_count !== null &&
            page_count !== ""
        ) {

            cleanPageCount =
                Number(page_count);

            if (
                !Number.isInteger(cleanPageCount) ||
                cleanPageCount < 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Page count must be a positive integer"
                });

            }

        }


        // =================================================
        // VALIDATE PUBLISH YEAR
        // =================================================

        let cleanFirstPublishYear = null;

        if (
            first_publish_year !== undefined &&
            first_publish_year !== null &&
            first_publish_year !== ""
        ) {

            cleanFirstPublishYear =
                Number(first_publish_year);

            if (
                !Number.isInteger(
                    cleanFirstPublishYear
                ) ||
                cleanFirstPublishYear < 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid publish year"
                });

            }

        }


        // =================================================
        // CLEAN AUTHORS
        // =================================================

        let cleanAuthors = null;

        if (authors !== undefined) {

            cleanAuthors = [
                ...new Set(
                    authors
                        .filter(
                            author =>
                                typeof author === "string"
                        )
                        .map(
                            author =>
                                author.trim()
                        )
                        .filter(Boolean)
                )
            ];

        }


        // =================================================
        // CLEAN SUBJECTS
        // =================================================

        let cleanSubjects = null;

        if (subjects !== undefined) {

            cleanSubjects = [
                ...new Set(
                    subjects
                        .filter(
                            subject =>
                                typeof subject === "string"
                        )
                        .map(
                            subject =>
                                subject
                                    .replace(/\s+/g, " ")
                                    .trim()
                        )
                        .filter(Boolean)
                )
            ];

        }


        // =================================================
        // START TRANSACTION
        // =================================================

        await connection.beginTransaction();


        // =================================================
        // DUPLICATE CHECK
        // =================================================

        const duplicateConditions = [];
        const duplicateValues = [];


        if (cleanOpenLibraryKey) {

            duplicateConditions.push(
                `
                open_library_key = ?
                AND id != ?
                `
            );

            duplicateValues.push(
                cleanOpenLibraryKey,
                bookId
            );

        }


        if (cleanIsbn10) {

            duplicateConditions.push(
                `
                isbn10 = ?
                AND id != ?
                `
            );

            duplicateValues.push(
                cleanIsbn10,
                bookId
            );

        }


        if (cleanIsbn13) {

            duplicateConditions.push(
                `
                isbn13 = ?
                AND id != ?
                `
            );

            duplicateValues.push(
                cleanIsbn13,
                bookId
            );

        }


        if (
            duplicateConditions.length > 0
        ) {

            const [duplicateRows] =
                await connection.execute(
                    `
                    SELECT
                        id,
                        title,
                        open_library_key,
                        isbn10,
                        isbn13
                    FROM books
                    WHERE
                        ${duplicateConditions.join(" OR ")}
                    LIMIT 1
                    `,
                    duplicateValues
                );


            if (
                duplicateRows.length > 0
            ) {

                await connection.rollback();

                return res.status(409).json({
                    success: false,
                    message:
                        "Another book already exists with the same Open Library key or ISBN",
                    data: duplicateRows[0]
                });

            }

        }


        // =================================================
        // UPDATE BOOK
        // =================================================

        await connection.execute(
            `
            UPDATE books
            SET

                open_library_key = ?,

                title = ?,

                subtitle = ?,

                isbn10 = ?,

                isbn13 = ?,

                publisher = ?,

                publish_date = ?,

                first_publish_year = ?,

                language = ?,

                description = ?,

                cover_url = ?,

                page_count = ?,

                data_source = ?

            WHERE id = ?
            `,
            [
                cleanOpenLibraryKey,
                cleanTitle,
                cleanSubtitle,
                cleanIsbn10,
                cleanIsbn13,
                cleanPublisher,
                cleanPublishDate,
                cleanFirstPublishYear,
                cleanLanguage,
                cleanDescription,
                cleanCoverUrl,
                cleanPageCount,
                cleanDataSource,
                bookId
            ]
        );


        // =================================================
        // UPDATE AUTHORS
        // =================================================

        if (cleanAuthors !== null) {

            // Remove old relationships

            await connection.execute(
                `
                DELETE FROM book_authors
                WHERE book_id = ?
                `,
                [bookId]
            );


            // Insert new relationships

            for (
                const authorName of cleanAuthors
            ) {

                const [authorRows] =
                    await connection.execute(
                        `
                        SELECT id
                        FROM authors
                        WHERE name = ?
                        LIMIT 1
                        `,
                        [authorName]
                    );


                let authorId;


                if (
                    authorRows.length > 0
                ) {

                    authorId =
                        authorRows[0].id;

                } else {

                    const [authorResult] =
                        await connection.execute(
                            `
                            INSERT INTO authors
                            (
                                name
                            )
                            VALUES (?)
                            `,
                            [authorName]
                        );

                    authorId =
                        authorResult.insertId;

                }


                await connection.execute(
                    `
                    INSERT IGNORE INTO book_authors
                    (
                        book_id,
                        author_id
                    )
                    VALUES (?, ?)
                    `,
                    [
                        bookId,
                        authorId
                    ]
                );

            }

        }


        // =================================================
        // UPDATE SUBJECTS
        // =================================================

        if (cleanSubjects !== null) {

            // Remove old relationships

            await connection.execute(
                `
                DELETE FROM book_subjects
                WHERE book_id = ?
                `,
                [bookId]
            );


            // Insert new relationships

            for (
                const subjectName of cleanSubjects
            ) {

                const [subjectRows] =
                    await connection.execute(
                        `
                        SELECT id
                        FROM subjects
                        WHERE name = ?
                        LIMIT 1
                        `,
                        [subjectName]
                    );


                let subjectId;


                if (
                    subjectRows.length > 0
                ) {

                    subjectId =
                        subjectRows[0].id;

                } else {

                    const [subjectResult] =
                        await connection.execute(
                            `
                            INSERT INTO subjects
                            (
                                name
                            )
                            VALUES (?)
                            `,
                            [subjectName]
                        );

                    subjectId =
                        subjectResult.insertId;

                }


                await connection.execute(
                    `
                    INSERT IGNORE INTO book_subjects
                    (
                        book_id,
                        subject_id
                    )
                    VALUES (?, ?)
                    `,
                    [
                        bookId,
                        subjectId
                    ]
                );

            }

        }


        // =================================================
        // COMMIT
        // =================================================

        await connection.commit();


        // =================================================
        // GET UPDATED BOOK
        // =================================================

        const [updatedRows] =
            await connection.execute(
                `
                SELECT
                    id,
                    open_library_key,
                    title,
                    subtitle,
                    isbn10,
                    isbn13,
                    publisher,
                    publish_date,
                    first_publish_year,
                    language,
                    description,
                    cover_url,
                    page_count,
                    data_source,
                    created_at,
                    updated_at
                FROM books
                WHERE id = ?
                LIMIT 1
                `,
                [bookId]
            );


        // =================================================
        // GET AUTHORS
        // =================================================

        const [authorRows] =
            await connection.execute(
                `
                SELECT
                    a.id,
                    a.name,
                    a.open_library_key
                FROM authors a
                INNER JOIN book_authors ba
                    ON ba.author_id = a.id
                WHERE ba.book_id = ?
                ORDER BY a.name ASC
                `,
                [bookId]
            );


        // =================================================
        // GET SUBJECTS
        // =================================================

        const [subjectRows] =
            await connection.execute(
                `
                SELECT
                    s.id,
                    s.name
                FROM subjects s
                INNER JOIN book_subjects bs
                    ON bs.subject_id = s.id
                WHERE bs.book_id = ?
                ORDER BY s.name ASC
                `,
                [bookId]
            );


        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({

            success: true,

            message:
                "Book updated successfully",

            data: {

                ...updatedRows[0],

                authors:
                    authorRows,

                subjects:
                    subjectRows

            }

        });


    } catch (error) {

        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error(
                "ROLLBACK ERROR:",
                rollbackError.message
            );
        }


        console.error(
            "UPDATE BOOK ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to update book"

        });


    } finally {

        connection.release();

    }

};

// =====================================================
// DELETE BOOK
// DELETE /api/books/:id
// STEP 12.5
// =====================================================
export const deleteBook = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const { id } = req.params;

        // =================================================
        // VALIDATE BOOK ID
        // =================================================

        const bookId = Number(id);

        if (
            !Number.isInteger(bookId) ||
            bookId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid book ID"
            });

        }


        // =================================================
        // CHECK BOOK EXISTS
        // =================================================

        const [bookRows] =
            await connection.execute(
                `
                SELECT
                    id,
                    title
                FROM books
                WHERE id = ?
                LIMIT 1
                `,
                [bookId]
            );


        if (bookRows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Book not found"
            });

        }


        const book = bookRows[0];


        // =================================================
        // START TRANSACTION
        // =================================================

        await connection.beginTransaction();


        // =================================================
        // DELETE BOOK AUTHORS
        // =================================================

        await connection.execute(
            `
            DELETE FROM book_authors
            WHERE book_id = ?
            `,
            [bookId]
        );


        // =================================================
        // DELETE BOOK SUBJECTS
        // =================================================

        await connection.execute(
            `
            DELETE FROM book_subjects
            WHERE book_id = ?
            `,
            [bookId]
        );


        // =================================================
        // DELETE BOOK
        // =================================================

        const [deleteResult] =
            await connection.execute(
                `
                DELETE FROM books
                WHERE id = ?
                `,
                [bookId]
            );


        // =================================================
        // CHECK DELETE RESULT
        // =================================================

        if (
            deleteResult.affectedRows === 0
        ) {

            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Book not found"
            });

        }


        // =================================================
        // COMMIT
        // =================================================

        await connection.commit();


        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({

            success: true,

            message:
                "Book deleted successfully",

            data: {

                id: book.id,

                title: book.title

            }

        });


    } catch (error) {

        // =================================================
        // ROLLBACK
        // =================================================

        try {

            await connection.rollback();

        } catch (rollbackError) {

            console.error(
                "DELETE BOOK ROLLBACK ERROR:",
                rollbackError.message
            );

        }


        console.error(
            "DELETE BOOK ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to delete book"

        });


    } finally {

        connection.release();

    }

};

// =====================================================
// STEP 15.7 — RECALCULATE SINGLE BOOK DATA QUALITY
// POST /api/data-quality/books/:id/recalculate
// =====================================================

export const recalculateBookDataQuality = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        // -------------------------------------------------
        // VALIDATE BOOK ID
        // -------------------------------------------------

        const bookId = parseInt(id, 10);

        if (
            !Number.isInteger(bookId) ||
            bookId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid book ID"
            });
        }

        // -------------------------------------------------
        // GET BOOK
        // -------------------------------------------------

        const [books] = await pool.execute(
            `
            SELECT
                id,
                title,
                isbn10,
                isbn13,
                publisher,
                language,
                page_count,
                cover_url,
                first_publish_year
            FROM books
            WHERE id = ?
            LIMIT 1
            `,
            [bookId]
        );

        // -------------------------------------------------
        // BOOK NOT FOUND
        // -------------------------------------------------

        if (books.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        const book = books[0];

        // -------------------------------------------------
        // CHECK FIELD QUALITY
        // -------------------------------------------------

        const missing = {
            isbn10:
                book.isbn10 === null ||
                String(book.isbn10).trim() === "",

            isbn13:
                book.isbn13 === null ||
                String(book.isbn13).trim() === "",

            publisher:
                book.publisher === null ||
                String(book.publisher).trim() === "",

            language:
                book.language === null ||
                String(book.language).trim() === "" ||
                book.language === "und",

            pageCount:
                book.page_count === null ||
                Number(book.page_count) <= 0,

            cover:
                book.cover_url === null ||
                String(book.cover_url).trim() === "",

            publishYear:
                book.first_publish_year === null ||
                Number(book.first_publish_year) <= 0
        };

        // -------------------------------------------------
        // CALCULATE QUALITY SCORE
        // -------------------------------------------------

        const totalFields = 7;

        const missingFieldCount =
            Object.values(missing).filter(Boolean).length;

        const validFieldCount =
            totalFields - missingFieldCount;

        const qualityScore = Number(
            (
                (validFieldCount / totalFields) *
                100
            ).toFixed(2)
        );

        // -------------------------------------------------
        // QUALITY STATUS
        // -------------------------------------------------

        let qualityStatus;

        if (qualityScore >= 80) {
            qualityStatus = "high";
        } else if (qualityScore >= 50) {
            qualityStatus = "medium";
        } else {
            qualityStatus = "low";
        }

        // -------------------------------------------------
        // UPDATE DATABASE
        // -------------------------------------------------

        await pool.execute(
            `
            UPDATE books
            SET
                data_quality_score = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [
                qualityScore,
                bookId
            ]
        );

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Book data quality recalculated successfully",

            data: {
                book: {
                    id: book.id,
                    title: book.title
                },

                quality: {
                    score: qualityScore,
                    status: qualityStatus,
                    missingFieldCount,

                    missing: {
                        isbn10: missing.isbn10,
                        isbn13: missing.isbn13,
                        publisher: missing.publisher,
                        language: missing.language,
                        pageCount: missing.pageCount,
                        cover: missing.cover,
                        publishYear: missing.publishYear
                    }
                }
            }
        });

    } catch (error) {
        console.error(
            "RECALCULATE BOOK DATA QUALITY ERROR:",
            error
        );

        next(error);
    }
};
// =====================================================
// STEP 15.8 — RECALCULATE ALL BOOKS DATA QUALITY
// POST /api/data-quality/recalculate
// =====================================================

export const recalculateAllBooksDataQuality = async (
    req,
    res,
    next
) => {
    try {
        // -------------------------------------------------
        // GET ALL BOOKS
        // -------------------------------------------------

        const [books] = await pool.execute(
            `
            SELECT
                id,
                isbn10,
                isbn13,
                publisher,
                language,
                page_count,
                cover_url,
                first_publish_year
            FROM books
            `
        );

        // -------------------------------------------------
        // NO BOOKS
        // -------------------------------------------------

        if (books.length === 0) {
            return res.status(200).json({
                success: true,
                message:
                    "No books found for recalculation",
                data: {
                    totalBooks: 0,
                    updatedBooks: 0,
                    highQualityBooks: 0,
                    mediumQualityBooks: 0,
                    lowQualityBooks: 0,
                    averageQualityScore: 0
                }
            });
        }

        // -------------------------------------------------
        // RECALCULATE EACH BOOK
        // -------------------------------------------------

        let updatedBooks = 0;
        let highQualityBooks = 0;
        let mediumQualityBooks = 0;
        let lowQualityBooks = 0;

        let totalQualityScore = 0;

        for (const book of books) {

            // ---------------------------------------------
            // CHECK MISSING FIELDS
            // ---------------------------------------------

            const missing = {
                isbn10:
                    book.isbn10 === null ||
                    String(book.isbn10).trim() === "",

                isbn13:
                    book.isbn13 === null ||
                    String(book.isbn13).trim() === "",

                publisher:
                    book.publisher === null ||
                    String(book.publisher).trim() === "",

                language:
                    book.language === null ||
                    String(book.language).trim() === "" ||
                    book.language === "und",

                pageCount:
                    book.page_count === null ||
                    Number(book.page_count) <= 0,

                cover:
                    book.cover_url === null ||
                    String(book.cover_url).trim() === "",

                publishYear:
                    book.first_publish_year === null ||
                    Number(book.first_publish_year) <= 0
            };

            // ---------------------------------------------
            // CALCULATE SCORE
            // ---------------------------------------------

            const totalFields = 7;

            const missingFieldCount =
                Object.values(missing).filter(Boolean).length;

            const validFieldCount =
                totalFields - missingFieldCount;

            const qualityScore = Number(
                (
                    (validFieldCount / totalFields) *
                    100
                ).toFixed(2)
            );

            // ---------------------------------------------
            // QUALITY CATEGORY
            // ---------------------------------------------

            if (qualityScore >= 80) {
                highQualityBooks++;
            } else if (qualityScore >= 50) {
                mediumQualityBooks++;
            } else {
                lowQualityBooks++;
            }

            totalQualityScore += qualityScore;

            // ---------------------------------------------
            // UPDATE BOOK
            // ---------------------------------------------

            await pool.execute(
                `
                UPDATE books
                SET
                    data_quality_score = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                `,
                [
                    qualityScore,
                    book.id
                ]
            );

            updatedBooks++;
        }

        // -------------------------------------------------
        // AVERAGE SCORE
        // -------------------------------------------------

        const averageQualityScore = Number(
            (
                totalQualityScore / books.length
            ).toFixed(2)
        );

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "All books data quality recalculated successfully",

            data: {
                totalBooks: books.length,

                updatedBooks,

                highQualityBooks,

                mediumQualityBooks,

                lowQualityBooks,

                averageQualityScore
            }
        });

    } catch (error) {
        console.error(
            "RECALCULATE ALL BOOKS DATA QUALITY ERROR:",
            error
        );

        next(error);
    }
};

// =====================================================
// STEP 15.9 — DATA QUALITY EXPORT
// GET /api/data-quality/export
// =====================================================

export const exportDataQuality = async (req, res) => {
    try {
        const {
            quality = "",
            search = ""
        } = req.query;

        // -------------------------------------------------
        // BUILD FILTER
        // -------------------------------------------------

        const conditions = [];
        const queryParams = [];

        const searchValue = String(search).trim();
        const qualityValue = String(quality).trim().toLowerCase();

        if (searchValue) {
            conditions.push(`
                (
                    b.title LIKE ?
                    OR b.open_library_key LIKE ?
                    OR b.isbn10 LIKE ?
                    OR b.isbn13 LIKE ?
                )
            `);

            const searchPattern = `%${searchValue}%`;

            queryParams.push(
                searchPattern,
                searchPattern,
                searchPattern,
                searchPattern
            );
        }

        if (qualityValue) {
            if (qualityValue === "high") {
                conditions.push(`
                    b.data_quality_score >= 80
                `);
            } else if (qualityValue === "medium") {
                conditions.push(`
                    b.data_quality_score >= 50
                    AND b.data_quality_score < 80
                `);
            } else if (qualityValue === "low") {
                conditions.push(`
                    (
                        b.data_quality_score < 50
                        OR b.data_quality_score IS NULL
                    )
                `);
            } else {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid quality filter. Use high, medium, or low"
                });
            }
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        // -------------------------------------------------
        // GET BOOKS
        // -------------------------------------------------

        const [books] = await pool.execute(
            `
            SELECT
                b.id,
                b.open_library_key,
                b.title,
                b.subtitle,
                b.isbn10,
                b.isbn13,
                b.publisher,
                b.language,
                b.page_count,
                b.cover_url,
                b.first_publish_year,
                b.data_quality_score,
                b.data_source,
                b.created_at,
                b.updated_at
            FROM books b
            ${whereClause}
            ORDER BY b.id ASC
            `,
            queryParams
        );

        // -------------------------------------------------
        // CSV HEADER
        // -------------------------------------------------

        const headers = [
            "ID",
            "Open Library Key",
            "Title",
            "Subtitle",
            "ISBN-10",
            "ISBN-13",
            "Publisher",
            "Language",
            "Page Count",
            "Cover URL",
            "Publish Year",
            "Quality Score",
            "Quality Status",
            "Data Source",
            "Created At",
            "Updated At"
        ];

        // -------------------------------------------------
        // CSV ESCAPE
        // -------------------------------------------------

        const escapeCsv = (value) => {
            if (
                value === null ||
                value === undefined
            ) {
                return "";
            }

            const stringValue =
                String(value);

            return `"${stringValue.replace(
                /"/g,
                '""'
            )}"`;
        };

        // -------------------------------------------------
        // BUILD CSV ROWS
        // -------------------------------------------------

        const rows = books.map((book) => {
            const score =
                Number(
                    book.data_quality_score || 0
                );

            let status = "low";

            if (score >= 80) {
                status = "high";
            } else if (score >= 50) {
                status = "medium";
            }

            return [
                book.id,
                book.open_library_key,
                book.title,
                book.subtitle,
                book.isbn10,
                book.isbn13,
                book.publisher,
                book.language,
                book.page_count,
                book.cover_url,
                book.first_publish_year,
                score,
                status,
                book.data_source,
                book.created_at,
                book.updated_at
            ]
                .map(escapeCsv)
                .join(",");
        });

        // -------------------------------------------------
        // FINAL CSV
        // -------------------------------------------------

        const csv = [
            headers.map(escapeCsv).join(","),
            ...rows
        ].join("\n");

        // -------------------------------------------------
        // DOWNLOAD RESPONSE
        // -------------------------------------------------

        const fileName =
            `data-quality-${new Date()
                .toISOString()
                .slice(0, 10)}.csv`;

        res.setHeader(
            "Content-Type",
            "text/csv; charset=utf-8"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
        );

        return res.status(200).send(csv);

    } catch (error) {
        console.error(
            "EXPORT DATA QUALITY ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to export data quality report"
        });
    }
};