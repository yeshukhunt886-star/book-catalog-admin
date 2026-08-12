import pool from "../config/db.js";

// =====================================================
// STEP 14.1 — GET ALL SUBJECTS
// GET /api/subjects
// =====================================================

export const getSubjects = async (req, res, next) => {
    try {
        const {
            search = "",
            page = 1,
            limit = 20
        } = req.query;

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

        let whereClause = "";
        const queryParams = [];

        const searchValue =
            String(search).trim();

        if (searchValue) {
            whereClause = `
                WHERE name LIKE ?
            `;

            queryParams.push(
                `%${searchValue}%`
            );
        }

        const [countRows] = await pool.execute(
            `
            SELECT COUNT(*) AS total
            FROM subjects
            ${whereClause}
            `,
            queryParams
        );

        const total =
            Number(countRows[0]?.total || 0);

        const [subjects] = await pool.execute(
            `
            SELECT
                id,
                name
            FROM subjects
            ${whereClause}
            ORDER BY name ASC
            LIMIT ? OFFSET ?
            `,
            [
                ...queryParams,
                pageLimit,
                offset
            ]
        );

        const totalPages =
            total === 0
                ? 0
                : Math.ceil(total / pageLimit);

        const hasNextPage =
            currentPage < totalPages;

        const hasPreviousPage =
            currentPage > 1 &&
            totalPages > 0;

        return res.status(200).json({
            success: true,
            message: "Subjects fetched successfully",

            data: {
                subjects,

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
                },

                search:
                    searchValue || null
            }
        });

    } catch (error) {
        console.error(
            "GET SUBJECTS ERROR:",
            error
        );

        next(error);
    }
};


// =====================================================
// STEP 14.2 — CREATE SUBJECT
// POST /api/subjects
// =====================================================

export const createSubject = async (req, res, next) => {
    try {
        const { name } = req.body;

        // ---------------------------------------------
        // VALIDATE NAME
        // ---------------------------------------------

        if (
            typeof name !== "string" ||
            !name.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Subject name is required"
            });
        }

        const cleanName =
            name
                .replace(/\s+/g, " ")
                .trim();

        // ---------------------------------------------
        // CHECK DUPLICATE
        // ---------------------------------------------

        const [existingSubjects] =
            await pool.execute(
                `
                SELECT
                    id,
                    name
                FROM subjects
                WHERE LOWER(name) = LOWER(?)
                LIMIT 1
                `,
                [cleanName]
            );

        if (existingSubjects.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Subject already exists",
                data: existingSubjects[0]
            });
        }

        // ---------------------------------------------
        // INSERT SUBJECT
        // ---------------------------------------------

        const [result] =
            await pool.execute(
                `
                INSERT INTO subjects
                (
                    name
                )
                VALUES (?)
                `,
                [cleanName]
            );

        const subjectId =
            result.insertId;

        // ---------------------------------------------
        // GET CREATED SUBJECT
        // ---------------------------------------------

        const [subjects] =
            await pool.execute(
                `
                SELECT
                    id,
                    name
                FROM subjects
                WHERE id = ?
                LIMIT 1
                `,
                [subjectId]
            );

        return res.status(201).json({
            success: true,
            message: "Subject created successfully",
            data: subjects[0]
        });

    } catch (error) {
        console.error(
            "CREATE SUBJECT ERROR:",
            error
        );

        next(error);
    }
};


// =====================================================
// STEP 14.3 — UPDATE SUBJECT
// PATCH /api/subjects/:id
// =====================================================

export const updateSubject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        // ---------------------------------------------
        // VALIDATE SUBJECT ID
        // ---------------------------------------------

        const subjectId =
            Number(id);

        if (
            !Number.isInteger(subjectId) ||
            subjectId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid subject ID"
            });
        }

        // ---------------------------------------------
        // VALIDATE NAME
        // ---------------------------------------------

        if (
            typeof name !== "string" ||
            !name.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Subject name is required"
            });
        }

        const cleanName =
            name
                .replace(/\s+/g, " ")
                .trim();

        // ---------------------------------------------
        // CHECK SUBJECT EXISTS
        // ---------------------------------------------

        const [existingSubjectRows] =
            await pool.execute(
                `
                SELECT
                    id,
                    name
                FROM subjects
                WHERE id = ?
                LIMIT 1
                `,
                [subjectId]
            );

        if (existingSubjectRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });
        }

        // ---------------------------------------------
        // CHECK DUPLICATE NAME
        // ---------------------------------------------

        const [duplicateRows] =
            await pool.execute(
                `
                SELECT
                    id,
                    name
                FROM subjects
                WHERE LOWER(name) = LOWER(?)
                AND id != ?
                LIMIT 1
                `,
                [
                    cleanName,
                    subjectId
                ]
            );

        if (duplicateRows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Subject name already exists",
                data: duplicateRows[0]
            });
        }

        // ---------------------------------------------
        // UPDATE SUBJECT
        // ---------------------------------------------

        await pool.execute(
            `
            UPDATE subjects
            SET name = ?
            WHERE id = ?
            `,
            [
                cleanName,
                subjectId
            ]
        );

        // ---------------------------------------------
        // GET UPDATED SUBJECT
        // ---------------------------------------------

        const [updatedRows] =
            await pool.execute(
                `
                SELECT
                    id,
                    name
                FROM subjects
                WHERE id = ?
                LIMIT 1
                `,
                [subjectId]
            );

        return res.status(200).json({
            success: true,
            message: "Subject updated successfully",
            data: updatedRows[0]
        });

    } catch (error) {
        console.error(
            "UPDATE SUBJECT ERROR:",
            error
        );

        next(error);
    }
};


// =====================================================
// STEP 14.4 — DELETE SUBJECT
// DELETE /api/subjects/:id
// =====================================================

export const deleteSubject = async (req, res, next) => {
    try {
        const { id } = req.params;

        // ---------------------------------------------
        // VALIDATE SUBJECT ID
        // ---------------------------------------------

        const subjectId =
            Number(id);

        if (
            !Number.isInteger(subjectId) ||
            subjectId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid subject ID"
            });
        }

        // ---------------------------------------------
        // CHECK SUBJECT EXISTS
        // ---------------------------------------------

        const [subjectRows] =
            await pool.execute(
                `
                SELECT
                    id,
                    name
                FROM subjects
                WHERE id = ?
                LIMIT 1
                `,
                [subjectId]
            );

        if (subjectRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });
        }

        const subject =
            subjectRows[0];

        // ---------------------------------------------
        // CHECK BOOK RELATIONSHIPS
        // ---------------------------------------------

        const [relationshipRows] =
            await pool.execute(
                `
                SELECT COUNT(*) AS total
                FROM book_subjects
                WHERE subject_id = ?
                `,
                [subjectId]
            );

        const bookCount =
            Number(
                relationshipRows[0]?.total || 0
            );

        // ---------------------------------------------
        // BLOCK DELETE IF SUBJECT IS USED
        // ---------------------------------------------

        if (bookCount > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Cannot delete subject because it is assigned to books",
                data: {
                    id: subject.id,
                    name: subject.name,
                    bookCount
                }
            });
        }

        // ---------------------------------------------
        // DELETE SUBJECT
        // ---------------------------------------------

        await pool.execute(
            `
            DELETE FROM subjects
            WHERE id = ?
            `,
            [subjectId]
        );

        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Subject deleted successfully",
            data: {
                id: subject.id,
                name: subject.name
            }
        });

    } catch (error) {
        console.error(
            "DELETE SUBJECT ERROR:",
            error
        );

        next(error);
    }
};


// =====================================================
// GET SUBJECT DETAILS + THEIR BOOKS
// GET /api/subjects/:id
// =====================================================

export const getSubjectDetails = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        const subjectId =
            Number(id);

        if (
            !Number.isInteger(subjectId) ||
            subjectId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid subject ID"
            });
        }

        const [subjects] =
            await pool.execute(
                `
                SELECT
                    id,
                    name
                FROM subjects
                WHERE id = ?
                LIMIT 1
                `,
                [subjectId]
            );

        if (subjects.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });
        }

        const subject =
            subjects[0];

        const [books] =
            await pool.execute(
                `
                SELECT DISTINCT
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
                INNER JOIN book_subjects bs
                    ON bs.book_id = b.id
                WHERE bs.subject_id = ?
                ORDER BY b.title ASC
                `,
                [subjectId]
            );

        return res.status(200).json({
            success: true,
            message:
                "Subject details fetched successfully",

            data: {
                subject: {
                    id: subject.id,
                    name: subject.name
                },

                books,

                totalBooks:
                    books.length
            }
        });

    } catch (error) {
        console.error(
            "GET SUBJECT DETAILS ERROR:",
            error
        );

        next(error);
    }
};


// =====================================================
// STEP 14.5 — SUBJECT STATISTICS
// GET /api/subjects/statistics
// =====================================================

export const getSubjectStatistics = async (
    req,
    res,
    next
) => {
    try {
        const {
            page = 1,
            limit = 20
        } = req.query;

        const currentPage =
            Math.max(
                parseInt(page, 10) || 1,
                1
            );

        const pageLimit =
            Math.min(
                Math.max(
                    parseInt(limit, 10) || 20,
                    1
                ),
                100
            );

        const offset =
            (currentPage - 1) * pageLimit;

        // ---------------------------------------------
        // TOTAL SUBJECTS
        // ---------------------------------------------

        const [totalSubjectRows] =
            await pool.execute(
                `
                SELECT COUNT(*) AS total
                FROM subjects
                `
            );

        const totalSubjects =
            Number(
                totalSubjectRows[0]?.total || 0
            );

        // ---------------------------------------------
        // SUBJECTS WITH BOOKS
        // ---------------------------------------------

        const [subjectsWithBooksRows] =
            await pool.execute(
                `
                SELECT COUNT(DISTINCT subject_id) AS total
                FROM book_subjects
                `
            );

        const subjectsWithBooks =
            Number(
                subjectsWithBooksRows[0]?.total || 0
            );

        // ---------------------------------------------
        // SUBJECTS WITHOUT BOOKS
        // ---------------------------------------------

        const subjectsWithoutBooks =
            Math.max(
                totalSubjects -
                subjectsWithBooks,
                0
            );

        // ---------------------------------------------
        // TOTAL BOOKS
        // ---------------------------------------------

        const [totalBookRows] =
            await pool.execute(
                `
                SELECT COUNT(*) AS total
                FROM books
                `
            );

        const totalBooks =
            Number(
                totalBookRows[0]?.total || 0
            );

        // ---------------------------------------------
        // TOTAL RELATIONSHIPS
        // ---------------------------------------------

        const [relationshipRows] =
            await pool.execute(
                `
                SELECT COUNT(*) AS total
                FROM book_subjects
                `
            );

        const totalBookSubjectRelationships =
            Number(
                relationshipRows[0]?.total || 0
            );

        // ---------------------------------------------
        // TOP SUBJECT
        // ---------------------------------------------

        const [topSubjectRows] =
            await pool.execute(
                `
                SELECT
                    s.id,
                    s.name,
                    COUNT(bs.book_id) AS bookCount
                FROM subjects s
                INNER JOIN book_subjects bs
                    ON bs.subject_id = s.id
                GROUP BY
                    s.id,
                    s.name
                ORDER BY
                    bookCount DESC,
                    s.name ASC
                LIMIT 1
                `
            );

        const topSubject =
            topSubjectRows.length > 0
                ? {
                    id: topSubjectRows[0].id,
                    name: topSubjectRows[0].name,
                    bookCount:
                        Number(
                            topSubjectRows[0].bookCount
                        )
                }
                : null;

        // ---------------------------------------------
        // AVERAGE
        // ---------------------------------------------

        const averageBooksPerSubject =
            totalSubjects > 0
                ? Number(
                    (
                        totalBookSubjectRelationships /
                        totalSubjects
                    ).toFixed(2)
                )
                : 0;

        // ---------------------------------------------
        // COUNT FOR PAGINATION
        // ---------------------------------------------

        const totalPages =
            totalSubjects === 0
                ? 0
                : Math.ceil(
                    totalSubjects /
                    pageLimit
                );

        // ---------------------------------------------
        // SUBJECT LIST WITH BOOK COUNT
        // ---------------------------------------------

        const [subjects] =
            await pool.execute(
                `
                SELECT
                    s.id,
                    s.name,
                    COUNT(bs.book_id) AS bookCount
                FROM subjects s
                LEFT JOIN book_subjects bs
                    ON bs.subject_id = s.id
                GROUP BY
                    s.id,
                    s.name
                ORDER BY
                    bookCount DESC,
                    s.name ASC
                LIMIT ? OFFSET ?
                `,
                [
                    pageLimit,
                    offset
                ]
            );

        const formattedSubjects =
            subjects.map((subject) => ({
                id: subject.id,
                name: subject.name,
                bookCount:
                    Number(
                        subject.bookCount || 0
                    )
            }));

        const hasNextPage =
            currentPage < totalPages;

        const hasPreviousPage =
            currentPage > 1 &&
            totalPages > 0;

        return res.status(200).json({
            success: true,
            message:
                "Subject statistics fetched successfully",

            data: {
                summary: {
                    totalSubjects,
                    subjectsWithBooks,
                    subjectsWithoutBooks,
                    totalBooks,
                    totalBookSubjectRelationships,
                    averageBooksPerSubject,
                    topSubject
                },

                subjects:
                    formattedSubjects,

                pagination: {
                    page: currentPage,
                    limit: pageLimit,
                    total: totalSubjects,
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
            "GET SUBJECT STATISTICS ERROR:",
            error
        );

        next(error);
    }
};