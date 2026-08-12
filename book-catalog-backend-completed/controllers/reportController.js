import pool from "../config/db.js";
import { convertToCSV } from "../utils/csvExporter.js";
 /*

# STEP 15.1 — REPORTS SUMMARY

GET /api/reports/summary

Returns:

1. Total books
2. Books by subject
3. Books by publish year
4. Top authors
5. Import summary
6. Recent import jobs

=====================================================
*/

export const getReportsSummary = async (req, res) => {
    try {

        /*
        =============================================
        1. TOTAL BOOKS
        =============================================
        */

        const [totalBookRows] = await pool.execute(`
            SELECT COUNT(*) AS totalBooks
            FROM books
        `);

        const totalBooks =
            Number(totalBookRows[0]?.totalBooks || 0);


        /*
        =============================================
        2. TOTAL AUTHORS
        =============================================
        */

        const [totalAuthorRows] = await pool.execute(`
            SELECT COUNT(*) AS totalAuthors
            FROM authors
        `);

        const totalAuthors =
            Number(totalAuthorRows[0]?.totalAuthors || 0);


        /*
        =============================================
        3. TOTAL SUBJECTS
        =============================================
        */

        const [totalSubjectRows] = await pool.execute(`
            SELECT COUNT(*) AS totalSubjects
            FROM subjects
        `);

        const totalSubjects =
            Number(totalSubjectRows[0]?.totalSubjects || 0);


        /*
        =============================================
        4. TOTAL IMPORTS
        =============================================
        */

        const [totalImportRows] = await pool.execute(`
            SELECT COUNT(*) AS totalImports
            FROM import_jobs
        `);

        const totalImports =
            Number(totalImportRows[0]?.totalImports || 0);


        /*
        =============================================
        5. BOOKS BY SUBJECT
        =============================================
        */

        const [subjectRows] = await pool.execute(`
            SELECT
                s.id,
                s.name,
                COUNT(DISTINCT bs.book_id) AS bookCount
            FROM subjects s
            INNER JOIN book_subjects bs
                ON bs.subject_id = s.id
            GROUP BY
                s.id,
                s.name
            ORDER BY
                bookCount DESC,
                s.name ASC
            LIMIT 20
        `);

        const booksBySubject =
            subjectRows.map((row) => ({
                id: Number(row.id),
                name: row.name,
                bookCount: Number(row.bookCount || 0)
            }));


        /*
        =============================================
        6. BOOKS BY PUBLISH YEAR
        =============================================
        */

        const [yearRows] = await pool.execute(`
            SELECT
                first_publish_year AS publishYear,
                COUNT(*) AS bookCount
            FROM books
            WHERE
                first_publish_year IS NOT NULL
                AND first_publish_year > 0
            GROUP BY
                first_publish_year
            ORDER BY
                first_publish_year ASC
        `);

        const booksByPublishYear =
            yearRows.map((row) => ({
                publishYear: Number(row.publishYear),
                bookCount: Number(row.bookCount || 0)
            }));


        /*
        =============================================
        7. TOP AUTHORS
        =============================================
        */

        const [authorRows] = await pool.execute(`
            SELECT
                a.id,
                a.name,
                COUNT(DISTINCT ba.book_id) AS bookCount
            FROM authors a
            INNER JOIN book_authors ba
                ON ba.author_id = a.id
            GROUP BY
                a.id,
                a.name
            ORDER BY
                bookCount DESC,
                a.name ASC
            LIMIT 20
        `);

        const topAuthors =
            authorRows.map((row) => ({
                id: Number(row.id),
                name: row.name,
                bookCount: Number(row.bookCount || 0)
            }));


        /*
        =============================================
        8. IMPORT SUMMARY
        =============================================
        */

        const [importSummaryRows] = await pool.execute(`
            SELECT
                COUNT(*) AS totalJobs,

                COALESCE(
                    SUM(requested_count),
                    0
                ) AS requestedBooks,

                COALESCE(
                    SUM(imported_count),
                    0
                ) AS importedBooks,

                COALESCE(
                    SUM(updated_count),
                    0
                ) AS updatedBooks,

                COALESCE(
                    SUM(skipped_count),
                    0
                ) AS skippedBooks,

                COALESCE(
                    SUM(failed_count),
                    0
                ) AS failedBooks

            FROM import_jobs
        `);

        const importSummary =
            importSummaryRows[0] || {};

        const importData = {

            totalJobs:
                Number(
                    importSummary.totalJobs || 0
                ),

            requestedBooks:
                Number(
                    importSummary.requestedBooks || 0
                ),

            importedBooks:
                Number(
                    importSummary.importedBooks || 0
                ),

            updatedBooks:
                Number(
                    importSummary.updatedBooks || 0
                ),

            skippedBooks:
                Number(
                    importSummary.skippedBooks || 0
                ),

            failedBooks:
                Number(
                    importSummary.failedBooks || 0
                )
        };


        /*
        =============================================
        9. IMPORT JOB STATUS SUMMARY
        =============================================
        */

        const [statusRows] = await pool.execute(`
            SELECT
                status,
                COUNT(*) AS jobCount
            FROM import_jobs
            GROUP BY status
            ORDER BY status ASC
        `);

        const importJobStatus =
            statusRows.map((row) => ({
                status: row.status,
                jobCount: Number(row.jobCount || 0)
            }));


        /*
        =============================================
        10. RECENT IMPORT JOBS
        =============================================
        */

        const [recentImportRows] = await pool.execute(`
            SELECT
                id,
                admin_id,
                requested_count,
                processed_count,
                imported_count,
                updated_count,
                skipped_count,
                failed_count,
                status,
                error_message,
                started_at,
                completed_at,
                created_at
            FROM import_jobs
            ORDER BY id DESC
            LIMIT 10
        `);

        const recentImports =
            recentImportRows.map((row) => ({
                id: Number(row.id),

                adminId:
                    row.admin_id !== null
                        ? Number(row.admin_id)
                        : null,

                requestedCount:
                    Number(row.requested_count || 0),

                processedCount:
                    Number(row.processed_count || 0),

                importedCount:
                    Number(row.imported_count || 0),

                updatedCount:
                    Number(row.updated_count || 0),

                skippedCount:
                    Number(row.skipped_count || 0),

                failedCount:
                    Number(row.failed_count || 0),

                status: row.status,

                errorMessage:
                    row.error_message || null,

                startedAt:
                    row.started_at,

                completedAt:
                    row.completed_at,

                createdAt:
                    row.created_at
            }));


        /*
        =============================================
        11. FINAL RESPONSE
        =============================================
        */

        return res.status(200).json({

            success: true,

            message:
                "Reports summary fetched successfully",

            data: {

                totalBooks,

                totalAuthors,

                totalSubjects,

                totalImports,

                booksBySubject,

                booksByPublishYear,

                topAuthors,

                importSummary: importData,

                importJobStatus,

                recentImports

            }

        });

    } catch (error) {

        console.error(
            "GET REPORTS SUMMARY ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch reports summary",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined

        });
    }
};


export const exportBooksCSV = async (req, res) => {
    try {
        const [books] = await pool.query(`
            SELECT
                b.id,
                b.title,
                b.first_publish_year AS publishYear,

                GROUP_CONCAT(
                    DISTINCT a.name
                    SEPARATOR ', '
                ) AS author,

                GROUP_CONCAT(
                    DISTINCT s.name
                    SEPARATOR ', '
                ) AS subjects

            FROM books b

            LEFT JOIN book_authors ba
                ON b.id = ba.book_id

            LEFT JOIN authors a
                ON ba.author_id = a.id

            LEFT JOIN book_subjects bs
                ON bs.book_id = b.id

            LEFT JOIN subjects s
                ON bs.subject_id = s.id

            GROUP BY
                b.id,
                b.title,
                b.first_publish_year

            ORDER BY
                b.id ASC
        `);

        const csv = convertToCSV(books);

        res.setHeader(
            "Content-Type",
            "text/csv; charset=utf-8"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=books.csv"
        );

        return res.status(200).send(csv);

    } catch (error) {
        console.error(
            "CSV EXPORT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to export books CSV",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined
        });
    }
};

/*
=====================================================
STEP 15.3 — BOOKS REPORT WITH FILTERS

GET /api/reports/books

Filters:
- search
- author
- subject
- year
- page
- limit
=====================================================
*/

export const getBooksReport = async (req, res) => {
    try {
        const {
            search = "",
            author = "",
            subject = "",
            year = "",
            page = 1,
            limit = 20
        } = req.query;

        const currentPage = Math.max(
            Number(page) || 1,
            1
        );

        const perPage = Math.min(
            Math.max(Number(limit) || 20, 1),
            100
        );

        const offset =
            (currentPage - 1) * perPage;

        const conditions = [];
        const params = [];

        /*
        =============================================
        SEARCH BY TITLE
        =============================================
        */

        if (search.trim()) {
            conditions.push(`
                b.title LIKE ?
            `);

            params.push(
                `%${search.trim()}%`
            );
        }

        /*
        =============================================
        FILTER BY AUTHOR
        =============================================
        */

        if (author.trim()) {
            conditions.push(`
                EXISTS (
                    SELECT 1
                    FROM book_authors ba_filter
                    INNER JOIN authors a_filter
                        ON a_filter.id = ba_filter.author_id
                    WHERE
                        ba_filter.book_id = b.id
                        AND a_filter.name LIKE ?
                )
            `);

            params.push(
                `%${author.trim()}%`
            );
        }

        /*
        =============================================
        FILTER BY SUBJECT
        =============================================
        */

        if (subject.trim()) {
            conditions.push(`
                EXISTS (
                    SELECT 1
                    FROM book_subjects bs_filter
                    INNER JOIN subjects s_filter
                        ON s_filter.id = bs_filter.subject_id
                    WHERE
                        bs_filter.book_id = b.id
                        AND s_filter.name LIKE ?
                )
            `);

            params.push(
                `%${subject.trim()}%`
            );
        }

        /*
        =============================================
        FILTER BY YEAR
        =============================================
        */

        if (year !== "") {
            const publishYear = Number(year);

            if (
                !Number.isInteger(publishYear) ||
                publishYear <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid publish year"
                });
            }

            conditions.push(`
                b.first_publish_year = ?
            `);

            params.push(publishYear);
        }

        /*
        =============================================
        WHERE CLAUSE
        =============================================
        */

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        /*
        =============================================
        TOTAL BOOK COUNT
        =============================================
        */

        const [countRows] =
            await pool.execute(
                `
                SELECT
                    COUNT(*) AS total
                FROM books b
                ${whereClause}
                `,
                params
            );

        const total =
            Number(
                countRows[0]?.total || 0
            );

        /*
        =============================================
        GET BOOKS
        =============================================
        */

        const [books] =
            await pool.execute(
                `
                SELECT
                    b.id,
                    b.title,
                    b.isbn10,
                    b.isbn13,
                    b.publisher,
                    b.publish_date,
                    b.first_publish_year,
                    b.language,
                    b.page_count,
                    b.data_source,
                    b.data_quality_score,
                    b.featured,
                    b.internal_category,

                    GROUP_CONCAT(
                        DISTINCT a.name
                        ORDER BY a.name
                        SEPARATOR ', '
                    ) AS authors,

                    GROUP_CONCAT(
                        DISTINCT s.name
                        ORDER BY s.name
                        SEPARATOR ', '
                    ) AS subjects

                FROM books b

                LEFT JOIN book_authors ba
                    ON ba.book_id = b.id

                LEFT JOIN authors a
                    ON a.id = ba.author_id

                LEFT JOIN book_subjects bs
                    ON bs.book_id = b.id

                LEFT JOIN subjects s
                    ON s.id = bs.subject_id

                ${whereClause}

                GROUP BY
                    b.id,
                    b.title,
                    b.isbn10,
                    b.isbn13,
                    b.publisher,
                    b.publish_date,
                    b.first_publish_year,
                    b.language,
                    b.page_count,
                    b.data_source,
                    b.data_quality_score,
                    b.featured,
                    b.internal_category

                ORDER BY
                    b.id ASC

                LIMIT ? OFFSET ?
                `,
                [
                    ...params,
                    perPage,
                    offset
                ]
            );

        /*
        =============================================
        PAGINATION
        =============================================
        */

        const totalPages =
            Math.ceil(total / perPage);

        /*
        =============================================
        RESPONSE
        =============================================
        */

        return res.status(200).json({
            success: true,

            message:
                "Books report fetched successfully",

            data: {
                books,

                pagination: {
                    page: currentPage,
                    limit: perPage,
                    total,
                    totalPages,

                    hasNextPage:
                        currentPage < totalPages,

                    hasPreviousPage:
                        currentPage > 1
                },

                filters: {
                    search: search.trim(),
                    author: author.trim(),
                    subject: subject.trim(),

                    year:
                        year !== ""
                            ? Number(year)
                            : null
                }
            }
        });

    } catch (error) {

        console.error(
            "GET BOOKS REPORT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to fetch books report",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined
        });
    }
};


// GET /api/reports/data-quality
export const getDataQualityReport = async (req, res) => {
    try {
        const [missingAuthors] = await pool.execute(`
            SELECT COUNT(*) AS total FROM books b
            LEFT JOIN book_authors ba ON ba.book_id = b.id
            WHERE ba.book_id IS NULL
        `);
        const [missingYears] = await pool.execute(`
            SELECT COUNT(*) AS total FROM books
            WHERE first_publish_year IS NULL OR first_publish_year <= 0
        `);
        const [dup13] = await pool.execute(`
            SELECT COUNT(*) AS total FROM (
                SELECT isbn13 FROM books
                WHERE isbn13 IS NOT NULL AND isbn13 <> ''
                GROUP BY isbn13 HAVING COUNT(*) > 1
            ) x
        `);
        const [dup10] = await pool.execute(`
            SELECT COUNT(*) AS total FROM (
                SELECT isbn10 FROM books
                WHERE isbn10 IS NOT NULL AND isbn10 <> ''
                GROUP BY isbn10 HAVING COUNT(*) > 1
            ) x
        `);
        const [weak] = await pool.execute(`
            SELECT COUNT(*) AS total FROM books
            WHERE title IS NULL OR TRIM(title) = ''
               OR data_quality_score IS NULL OR data_quality_score < 50
        `);
        return res.json({
            success: true,
            message: "Data quality report fetched successfully",
            data: {
                missingAuthors: Number(missingAuthors[0]?.total || 0),
                missingPublishYear: Number(missingYears[0]?.total || 0),
                duplicateISBN13: Number(dup13[0]?.total || 0),
                duplicateISBN10: Number(dup10[0]?.total || 0),
                weakData: Number(weak[0]?.total || 0)
            }
        });
    } catch (error) {
        console.error("DATA QUALITY REPORT ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch data quality report"
        });
    }
};
