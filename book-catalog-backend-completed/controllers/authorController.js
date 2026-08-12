
import pool from "../config/db.js";

/*
=====================================================
STEP 13 — AUTHORS
=====================================================

STEP 13.1 → Get All Authors
STEP 13.2 → Get Author Details
STEP 13.3 → Author Book Count / Statistics
STEP 13.4 → Create Author

=====================================================
*/


// =====================================================
// STEP 13.1 — GET ALL AUTHORS
// GET /api/authors
// =====================================================

export const getAuthors = async (req, res, next) => {

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


        const cleanSearch =
            typeof search === "string"
                ? search.trim()
                : "";

        let whereClause = "";

        const queryParams = [];

        if (cleanSearch) {

            whereClause = `
                WHERE name LIKE ?
            `;

            queryParams.push(
                `%${cleanSearch}%`
            );
        }


        const [countRows] =
            await pool.execute(
                `
                SELECT
                    COUNT(*) AS total
                FROM authors
                ${whereClause}
                `,
                queryParams
            );


        const total =
            Number(
                countRows[0]?.total || 0
            );


        const [authors] =
            await pool.execute(
                `
                SELECT
                    id,
                    name,
                    open_library_key
                FROM authors
                ${whereClause}
                ORDER BY name ASC
                LIMIT ${pageLimit}
                OFFSET ${offset}
                `,
                queryParams
            );


        const totalPages =
            total === 0
                ? 0
                : Math.ceil(
                    total / pageLimit
                );


        const hasNextPage =
            currentPage < totalPages;

        const hasPreviousPage =
            currentPage > 1 &&
            totalPages > 0;


        return res.status(200).json({

            success: true,

            message:
                "Authors fetched successfully",

            data: {

                authors,

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
            "GET AUTHORS ERROR:",
            error
        );

        next(error);
    }
};



// =====================================================
// STEP 13.2 — GET AUTHOR DETAILS
// GET /api/authors/:id
// =====================================================

export const getAuthorDetails = async (
    req,
    res,
    next
) => {

    try {

        const { id } = req.params;

        const authorId =
            parseInt(id, 10);


        if (
            !Number.isInteger(authorId) ||
            authorId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid author ID"
            });
        }


        const [authors] =
            await pool.execute(
                `
                SELECT
                    id,
                    name,
                    open_library_key
                FROM authors
                WHERE id = ?
                LIMIT 1
                `,
                [authorId]
            );


        if (authors.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Author not found"
            });
        }


        const author =
            authors[0];


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

                INNER JOIN book_authors ba
                    ON ba.book_id = b.id

                WHERE ba.author_id = ?

                ORDER BY b.title ASC
                `,
                [authorId]
            );


        return res.status(200).json({

            success: true,

            message:
                "Author details fetched successfully",

            data: {

                author: {

                    id: author.id,

                    name: author.name,

                    open_library_key:
                        author.open_library_key
                },

                books,

                totalBooks:
                    books.length
            }
        });

    } catch (error) {

        console.error(
            "GET AUTHOR DETAILS ERROR:",
            error
        );

        next(error);
    }
};



// =====================================================
// STEP 13.3 — AUTHOR BOOK COUNT / STATISTICS
// GET /api/authors/statistics
// =====================================================

export const getAuthorStatistics = async (
    req,
    res,
    next
) => {

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


        const cleanSearch =
            typeof search === "string"
                ? search.trim()
                : "";


        let whereClause = "";

        const queryParams = [];


        if (cleanSearch) {

            whereClause = `
                WHERE a.name LIKE ?
            `;

            queryParams.push(
                `%${cleanSearch}%`
            );
        }


        const [countRows] =
            await pool.execute(
                `
                SELECT
                    COUNT(*) AS total
                FROM authors a
                ${whereClause}
                `,
                queryParams
            );


        const totalAuthors =
            Number(
                countRows[0]?.total || 0
            );


        const [authors] =
            await pool.execute(
                `
                SELECT

                    a.id,

                    a.name,

                    a.open_library_key,

                    COUNT(DISTINCT ba.book_id)
                        AS book_count

                FROM authors a

                LEFT JOIN book_authors ba
                    ON ba.author_id = a.id

                ${whereClause}

                GROUP BY
                    a.id,
                    a.name,
                    a.open_library_key

                ORDER BY
                    book_count DESC,
                    a.name ASC

                LIMIT ${pageLimit}
                OFFSET ${offset}
                `,
                queryParams
            );


        const formattedAuthors =
            authors.map((author) => ({

                id:
                    author.id,

                name:
                    author.name,

                open_library_key:
                    author.open_library_key,

                bookCount:
                    Number(
                        author.book_count || 0
                    )
            }));


        const [relationshipRows] =
            await pool.execute(
                `
                SELECT
                    COUNT(*) AS total
                FROM book_authors
                `
            );


        const totalBookAuthorRelationships =
            Number(
                relationshipRows[0]?.total || 0
            );


        const [authorsWithBooksRows] =
            await pool.execute(
                `
                SELECT
                    COUNT(DISTINCT author_id) AS total
                FROM book_authors
                `
            );


        const authorsWithBooks =
            Number(
                authorsWithBooksRows[0]?.total || 0
            );


        const authorsWithoutBooks =
            Math.max(
                totalAuthors - authorsWithBooks,
                0
            );


        const [bookRows] =
            await pool.execute(
                `
                SELECT
                    COUNT(*) AS total
                FROM books
                `
            );


        const totalBooks =
            Number(
                bookRows[0]?.total || 0
            );


        const averageBooksPerAuthor =
            totalAuthors === 0
                ? 0
                : Number(
                    (
                        totalBookAuthorRelationships /
                        totalAuthors
                    ).toFixed(2)
                );


        const [topAuthorRows] =
            await pool.execute(
                `
                SELECT

                    a.id,

                    a.name,

                    COUNT(DISTINCT ba.book_id)
                        AS book_count

                FROM authors a

                INNER JOIN book_authors ba
                    ON ba.author_id = a.id

                GROUP BY
                    a.id,
                    a.name

                ORDER BY
                    book_count DESC,
                    a.name ASC

                LIMIT 1
                `
            );


        let topAuthor = null;


        if (topAuthorRows.length > 0) {

            topAuthor = {

                id:
                    topAuthorRows[0].id,

                name:
                    topAuthorRows[0].name,

                bookCount:
                    Number(
                        topAuthorRows[0].book_count || 0
                    )
            };
        }


        const totalPages =
            totalAuthors === 0
                ? 0
                : Math.ceil(
                    totalAuthors / pageLimit
                );


        const hasNextPage =
            currentPage < totalPages;

        const hasPreviousPage =
            currentPage > 1 &&
            totalPages > 0;


        return res.status(200).json({

            success: true,

            message:
                "Author statistics fetched successfully",

            data: {

                summary: {

                    totalAuthors,

                    authorsWithBooks,

                    authorsWithoutBooks,

                    totalBooks,

                    totalBookAuthorRelationships,

                    averageBooksPerAuthor,

                    topAuthor
                },

                authors:
                    formattedAuthors,

                pagination: {

                    page:
                        currentPage,

                    limit:
                        pageLimit,

                    total:
                        totalAuthors,

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
            "GET AUTHOR STATISTICS ERROR:",
            error
        );

        next(error);
    }
};



// =====================================================
// STEP 13.4 — CREATE AUTHOR
// POST /api/authors
// =====================================================

export const createAuthor = async (
    req,
    res,
    next
) => {

    try {

        const {
            name,
            open_library_key
        } = req.body;


        // -------------------------------------------------
        // VALIDATE NAME
        // -------------------------------------------------

        if (
            name === undefined ||
            name === null ||
            typeof name !== "string" ||
            !name.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Author name is required"
            });
        }


        // -------------------------------------------------
        // CLEAN NAME
        // -------------------------------------------------

        const cleanName =
            name
                .replace(/\s+/g, " ")
                .trim();


        // -------------------------------------------------
        // VALIDATE NAME LENGTH
        // -------------------------------------------------

        if (cleanName.length < 2) {

            return res.status(400).json({

                success: false,

                message:
                    "Author name must contain at least 2 characters"
            });
        }


        if (cleanName.length > 255) {

            return res.status(400).json({

                success: false,

                message:
                    "Author name must not exceed 255 characters"
            });
        }


        // -------------------------------------------------
        // CLEAN OPEN LIBRARY KEY
        // -------------------------------------------------

        let cleanOpenLibraryKey = null;


        if (
            open_library_key !== undefined &&
            open_library_key !== null
        ) {

            if (
                typeof open_library_key !== "string"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "open_library_key must be a string"
                });
            }


            cleanOpenLibraryKey =
                open_library_key.trim();


            if (
                cleanOpenLibraryKey === ""
            ) {

                cleanOpenLibraryKey = null;
            }
        }


        // -------------------------------------------------
        // DUPLICATE NAME CHECK
        // -------------------------------------------------

        const [existingNameRows] =
            await pool.execute(
                `
                SELECT
                    id,
                    name,
                    open_library_key
                FROM authors
                WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
                LIMIT 1
                `,
                [cleanName]
            );


        if (
            existingNameRows.length > 0
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "Author already exists",

                data:
                    existingNameRows[0]
            });
        }


        // -------------------------------------------------
        // DUPLICATE OPEN LIBRARY KEY
        // -------------------------------------------------

        if (cleanOpenLibraryKey) {

            const [existingKeyRows] =
                await pool.execute(
                    `
                    SELECT
                        id,
                        name,
                        open_library_key
                    FROM authors
                    WHERE open_library_key = ?
                    LIMIT 1
                    `,
                    [cleanOpenLibraryKey]
                );


            if (
                existingKeyRows.length > 0
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Author with this Open Library key already exists",

                    data:
                        existingKeyRows[0]
                });
            }
        }


        // -------------------------------------------------
        // INSERT AUTHOR
        // -------------------------------------------------

        const [result] =
            await pool.execute(
                `
                INSERT INTO authors
                (
                    name,
                    open_library_key
                )
                VALUES (?, ?)
                `,
                [
                    cleanName,
                    cleanOpenLibraryKey
                ]
            );


        const authorId =
            result.insertId;


        // -------------------------------------------------
        // GET CREATED AUTHOR
        // -------------------------------------------------

        const [createdRows] =
            await pool.execute(
                `
                SELECT
                    id,
                    name,
                    open_library_key
                FROM authors
                WHERE id = ?
                LIMIT 1
                `,
                [authorId]
            );


        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(201).json({

            success: true,

            message:
                "Author created successfully",

            data:
                createdRows[0]
        });

    } catch (error) {

        console.error(
            "CREATE AUTHOR ERROR:",
            error
        );


        // -------------------------------------------------
        // MYSQL DUPLICATE ERROR
        // -------------------------------------------------

        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({

                success: false,

                message:
                    "Author already exists"
            });
        }


        next(error);
    }
};


// =====================================================
// UPDATE AUTHOR
// PATCH /api/authors/:id
// =====================================================

export const updateAuthor = async (req, res) => {
  try {
    const authorId = Number(req.params.id);

    const { name } = req.body;

    // -----------------------------------------------
    // Validate ID
    // -----------------------------------------------

    if (!authorId || Number.isNaN(authorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid author ID",
      });
    }

    // -----------------------------------------------
    // Validate name
    // -----------------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Author name is required",
      });
    }

    // -----------------------------------------------
    // Check author exists
    // -----------------------------------------------

    const [existingAuthors] = await pool.query(
      `
      SELECT id, name
      FROM authors
      WHERE id = ?
      LIMIT 1
      `,
      [authorId]
    );

    if (existingAuthors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Author not found",
      });
    }

    // -----------------------------------------------
    // Check duplicate name
    // -----------------------------------------------

    const [duplicateAuthors] = await pool.query(
      `
      SELECT id
      FROM authors
      WHERE LOWER(name) = LOWER(?)
      AND id <> ?
      LIMIT 1
      `,
      [
        name.trim(),
        authorId,
      ]
    );

    if (duplicateAuthors.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An author with this name already exists",
      });
    }

    // -----------------------------------------------
    // UPDATE AUTHOR
    // Only columns that actually exist
    // -----------------------------------------------

    const [result] = await pool.query(
      `
      UPDATE authors
      SET name = ?
      WHERE id = ?
      `,
      [
        name.trim(),
        authorId,
      ]
    );

    // -----------------------------------------------
    // Check update
    // -----------------------------------------------

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Author was not updated",
      });
    }

    // -----------------------------------------------
    // Get updated author
    // -----------------------------------------------

    const [updatedAuthors] = await pool.query(
      `
      SELECT
        id,
        name,
        open_library_key
      FROM authors
      WHERE id = ?
      LIMIT 1
      `,
      [authorId]
    );

    // -----------------------------------------------
    // SUCCESS
    // -----------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Author updated successfully",
      data: updatedAuthors[0],
    });

  } catch (error) {

    console.error(
      "UPDATE AUTHOR ERROR:",
      error
    );

    // -----------------------------------------------
    // Duplicate error
    // -----------------------------------------------

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "An author with this name already exists",
      });
    }

    // -----------------------------------------------
    // General error
    // -----------------------------------------------

    return res.status(500).json({
      success: false,
      message: "Failed to update author",
      error: error.message,
    });
  }
};


// =====================================================
// DELETE AUTHOR
// DELETE /api/authors/:id
// =====================================================

export const deleteAuthor = async (req, res) => {
  let connection;

  try {
    const authorId = Number(req.params.id);

    // -----------------------------------------------
    // Validate ID
    // -----------------------------------------------

    if (!authorId || Number.isNaN(authorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid author ID",
      });
    }

    // -----------------------------------------------
    // Get database connection
    // -----------------------------------------------

    connection = await pool.getConnection();

    // -----------------------------------------------
    // Start transaction
    // -----------------------------------------------

    await connection.beginTransaction();

    // -----------------------------------------------
    // Check author exists
    // -----------------------------------------------

    const [authors] = await connection.query(
      `
      SELECT id, name
      FROM authors
      WHERE id = ?
      LIMIT 1
      `,
      [authorId]
    );

    if (authors.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Author not found",
      });
    }

    const author = authors[0];

    // -----------------------------------------------
    // Check book relationships
    // -----------------------------------------------

    const [relationships] = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM book_authors
      WHERE author_id = ?
      `,
      [authorId]
    );

    const relationshipCount =
      Number(relationships[0]?.total || 0);

    console.log(
      "AUTHOR BOOK RELATIONSHIPS:",
      relationshipCount
    );

    // -----------------------------------------------
    // Remove book-author relationships
    // -----------------------------------------------

    if (relationshipCount > 0) {
      await connection.query(
        `
        DELETE FROM book_authors
        WHERE author_id = ?
        `,
        [authorId]
      );
    }

    // -----------------------------------------------
    // Delete author
    // -----------------------------------------------

    const [deleteResult] =
      await connection.query(
        `
        DELETE FROM authors
        WHERE id = ?
        `,
        [authorId]
      );

    // -----------------------------------------------
    // Verify delete
    // -----------------------------------------------

    if (deleteResult.affectedRows === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Author not found or already deleted",
      });
    }

    // -----------------------------------------------
    // Commit
    // -----------------------------------------------

    await connection.commit();

    // -----------------------------------------------
    // Success
    // -----------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Author deleted successfully",
      data: {
        id: author.id,
        name: author.name,
        removedBookRelationships:
          relationshipCount,
      },
    });

  } catch (error) {

    console.error(
      "DELETE AUTHOR ERROR:",
      error
    );

    // -----------------------------------------------
    // Rollback transaction
    // -----------------------------------------------

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "ROLLBACK ERROR:",
          rollbackError
        );
      }
    }

    // -----------------------------------------------
    // Foreign key error
    // -----------------------------------------------

    if (
      error.code ===
        "ER_ROW_IS_REFERENCED_2" ||
      error.code ===
        "ER_ROW_IS_REFERENCED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Author cannot be deleted because it is still referenced by another table.",
      });
    }

    // -----------------------------------------------
    // General error
    // -----------------------------------------------

    return res.status(500).json({
      success: false,
      message: "Failed to delete author",
      error: error.message,
    });

  } finally {

    if (connection) {
      connection.release();
    }
  }
};