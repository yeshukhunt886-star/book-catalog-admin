// =====================================================
// IMPORT SERVICE
// BOOK CATALOG DATA IMPORT ADMIN PORTAL
//
// STEP 8  → Import 100 / 500 / 1000 books
// STEP 9  → Clean + validate imported data
// STEP 9A → Authors + Subjects
// STEP 10 → Duplicate Handling + UPSERT
// STEP 11 → Import Jobs + Logs
// =====================================================

import pool from "../config/db.js";

import {
    searchBooks
} from "./openLibraryService.js";

import {
    cleanAndValidateBook
} from "../utils/bookValidator.js";

import {
    createImportJob,
    updateImportJob,
    completeImportJob,
    failImportJob
} from "./importJobService.js";


// =====================================================
// ALLOWED IMPORT SIZES
// =====================================================

const ALLOWED_IMPORT_SIZES = [
    100,
    500,
    1000
];


// =====================================================
// SEARCH QUERIES
// =====================================================

const IMPORT_SEARCH_QUERIES = [
    "book",
    "history",
    "science",
    "technology",
    "fiction",
    "novel",
    "education",
    "computer",
    "business",
    "art"
];


// =====================================================
// VALIDATE IMPORT SIZE
// =====================================================

export const validateImportSize = (count) => {

    const importCount = Number(count);

    if (
        !ALLOWED_IMPORT_SIZES.includes(importCount)
    ) {

        const error = new Error(
            "Import count must be 100, 500, or 1000"
        );

        error.statusCode = 400;

        throw error;
    }

    return importCount;
};


// =====================================================
// NORMALIZE BOOK
// =====================================================

const normalizeBook = (book) => {

    if (
        !book ||
        typeof book !== "object"
    ) {
        return null;
    }


    // =============================================
    // TITLE
    // =============================================

    const title =
        typeof book.title === "string"
            ? book.title.trim()
            : null;

    if (!title) {
        return null;
    }


    // =============================================
    // OPEN LIBRARY KEY
    // =============================================

    const openLibraryKey =
        typeof book.key === "string"
            ? book.key.trim()
            : null;


    // =============================================
    // ISBN
    // =============================================

    const isbnList =
        Array.isArray(book.isbn)
            ? book.isbn
            : [];

    let isbn10 = null;
    let isbn13 = null;

    for (const isbn of isbnList) {

        if (
            typeof isbn !== "string"
        ) {
            continue;
        }

        const clean =
            isbn
                .replace(/[-\s]/g, "")
                .trim()
                .toUpperCase();

        if (
            !isbn10 &&
            clean.length === 10
        ) {
            isbn10 = clean;
        }

        if (
            !isbn13 &&
            clean.length === 13
        ) {
            isbn13 = clean;
        }
    }


    // =============================================
    // PUBLISHER
    // =============================================

    const publisher =
        Array.isArray(book.publisher) &&
        book.publisher.length > 0
            ? String(book.publisher[0]).trim()
            : null;


    // =============================================
    // PUBLISH DATE
    // =============================================

    const publishDate =
        Array.isArray(book.publish_date) &&
        book.publish_date.length > 0
            ? String(book.publish_date[0]).trim()
            : null;


    // =============================================
    // YEAR
    // =============================================

    const firstPublishYear =
        Number.isInteger(book.first_publish_year)
            ? book.first_publish_year
            : null;


    // =============================================
    // LANGUAGE
    // =============================================

    const language =
        Array.isArray(book.language) &&
        book.language.length > 0
            ? String(book.language[0]).trim()
            : null;


    // =============================================
    // COVER
    // =============================================

    const coverUrl =
        book.cover_i
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
            : null;


    // =============================================
    // PAGE COUNT
    // =============================================

    const pageCount =
        Number.isInteger(book.number_of_pages_median)
            ? book.number_of_pages_median
            : null;


    // =============================================
    // AUTHORS
    // =============================================

    const authors =
        Array.isArray(book.author_name)
            ? book.author_name
                .filter(
                    (name) =>
                        typeof name === "string"
                )
                .map(
                    (name) =>
                        name.trim()
                )
                .filter(Boolean)
            : [];


    // =============================================
    // AUTHOR KEYS
    // =============================================

    const authorKeys =
        Array.isArray(book.author_key)
            ? book.author_key
                .filter(
                    (key) =>
                        typeof key === "string"
                )
                .map(
                    (key) =>
                        key.trim()
                )
                .filter(Boolean)
            : [];


    // =============================================
    // SUBJECTS
    // =============================================

    const subjects =
        Array.isArray(book.subject)
            ? [
                ...new Set(
                    book.subject
                        .filter(
                            (subject) =>
                                typeof subject === "string"
                        )
                        .map(
                            (subject) =>
                                subject
                                    .replace(/\s+/g, " ")
                                    .trim()
                        )
                        .filter(Boolean)
                )
            ].slice(0, 30)
            : [];


    // =============================================
    // DESCRIPTION
    // =============================================

    let description = null;

    if (
        typeof book.description === "string"
    ) {
        description =
            book.description.trim();
    }

    if (
        book.description &&
        typeof book.description === "object" &&
        typeof book.description.value === "string"
    ) {
        description =
            book.description.value.trim();
    }


    // =============================================
    // RETURN
    // =============================================

    return {

        openLibraryKey,

        title,

        subtitle:
            typeof book.subtitle === "string"
                ? book.subtitle.trim()
                : null,

        isbn10,

        isbn13,

        publisher,

        publishDate,

        firstPublishYear,

        language,

        description,

        coverUrl,

        pageCount,

        authors,

        authorKeys,

        subjects
    };
};


// =====================================================
// FIND EXISTING BOOK
// =====================================================

const findExistingBook = async (
    connection,
    book
) => {

    // =============================================
    // 1. OPEN LIBRARY KEY
    // =============================================

    if (book.openLibraryKey) {

        const [rows] =
            await connection.execute(
                `
                SELECT id
                FROM books
                WHERE open_library_key = ?
                LIMIT 1
                `,
                [
                    book.openLibraryKey
                ]
            );

        if (rows.length > 0) {
            return rows[0];
        }
    }


    // =============================================
    // 2. ISBN-13
    // =============================================

    if (book.isbn13) {

        const [rows] =
            await connection.execute(
                `
                SELECT id
                FROM books
                WHERE isbn13 = ?
                LIMIT 1
                `,
                [
                    book.isbn13
                ]
            );

        if (rows.length > 0) {
            return rows[0];
        }
    }


    // =============================================
    // 3. ISBN-10
    // =============================================

    if (book.isbn10) {

        const [rows] =
            await connection.execute(
                `
                SELECT id
                FROM books
                WHERE isbn10 = ?
                LIMIT 1
                `,
                [
                    book.isbn10
                ]
            );

        if (rows.length > 0) {
            return rows[0];
        }
    }


    return null;
};


// =====================================================
// UPSERT BOOK
// =====================================================

const upsertBook = async (
    connection,
    book
) => {

    const existingBook =
        await findExistingBook(
            connection,
            book
        );


    // =============================================
    // INSERT NEW BOOK
    // =============================================

    if (!existingBook) {

        const [result] =
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
                    book.openLibraryKey,
                    book.title,
                    book.subtitle,
                    book.isbn10,
                    book.isbn13,
                    book.publisher,
                    book.publishDate,
                    book.firstPublishYear,
                    book.language,
                    book.description,
                    book.coverUrl,
                    book.pageCount,
                    "Open Library"
                ]
            );

        return {
            id: result.insertId,
            action: "inserted"
        };
    }


    // =============================================
    // UPDATE EXISTING BOOK
    // =============================================

    await connection.execute(
        `
        UPDATE books
        SET

            open_library_key =
                COALESCE(
                    open_library_key,
                    ?
                ),

            title =
                COALESCE(
                    NULLIF(?, ''),
                    title
                ),

            subtitle =
                COALESCE(
                    NULLIF(?, ''),
                    subtitle
                ),

            isbn10 =
                COALESCE(
                    NULLIF(?, ''),
                    isbn10
                ),

            isbn13 =
                COALESCE(
                    NULLIF(?, ''),
                    isbn13
                ),

            publisher =
                COALESCE(
                    NULLIF(?, ''),
                    publisher
                ),

            publish_date =
                COALESCE(
                    NULLIF(?, ''),
                    publish_date
                ),

            first_publish_year =
                COALESCE(
                    ?,
                    first_publish_year
                ),

            language =
                COALESCE(
                    NULLIF(?, ''),
                    language
                ),

            description =
                COALESCE(
                    NULLIF(?, ''),
                    description
                ),

            cover_url =
                COALESCE(
                    NULLIF(?, ''),
                    cover_url
                ),

            page_count =
                COALESCE(
                    ?,
                    page_count
                ),

            data_source =
                COALESCE(
                    NULLIF(?, ''),
                    data_source
                )

        WHERE id = ?
        `,
        [
            book.openLibraryKey,
            book.title,
            book.subtitle,
            book.isbn10,
            book.isbn13,
            book.publisher,
            book.publishDate,
            book.firstPublishYear,
            book.language,
            book.description,
            book.coverUrl,
            book.pageCount,
            "Open Library",
            existingBook.id
        ]
    );


    return {
        id: existingBook.id,
        action: "updated"
    };
};


// =====================================================
// INSERT / FIND AUTHOR
// =====================================================

const insertAuthor = async (
    connection,
    name,
    openLibraryKey = null
) => {

    if (
        !name ||
        !name.trim()
    ) {
        return null;
    }

    const cleanName =
        name.trim();


    // =============================================
    // FIND BY OPEN LIBRARY KEY
    // =============================================

    if (openLibraryKey) {

        const [rows] =
            await connection.execute(
                `
                SELECT id
                FROM authors
                WHERE open_library_key = ?
                LIMIT 1
                `,
                [
                    openLibraryKey
                ]
            );

        if (rows.length > 0) {
            return rows[0].id;
        }
    }


    // =============================================
    // FIND BY NAME
    // =============================================

    const [rows] =
        await connection.execute(
            `
            SELECT id
            FROM authors
            WHERE name = ?
            LIMIT 1
            `,
            [
                cleanName
            ]
        );


    if (rows.length > 0) {
        return rows[0].id;
    }


    // =============================================
    // CREATE AUTHOR
    // =============================================

    const [result] =
        await connection.execute(
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
                openLibraryKey
            ]
        );


    return result.insertId;
};


// =====================================================
// INSERT / FIND SUBJECT
// =====================================================

const insertSubject = async (
    connection,
    name
) => {

    if (
        !name ||
        !name.trim()
    ) {
        return null;
    }


    const cleanName =
        name
            .replace(/\s+/g, " ")
            .trim();


    // =============================================
    // FIND EXISTING
    // =============================================

    const [rows] =
        await connection.execute(
            `
            SELECT id
            FROM subjects
            WHERE name = ?
            LIMIT 1
            `,
            [
                cleanName
            ]
        );


    if (rows.length > 0) {
        return rows[0].id;
    }


    // =============================================
    // CREATE SUBJECT
    // =============================================

    const [result] =
        await connection.execute(
            `
            INSERT INTO subjects
            (
                name
            )
            VALUES (?)
            `,
            [
                cleanName
            ]
        );


    return result.insertId;
};


// =====================================================
// UPDATE BOOK RELATIONSHIPS
// =====================================================

const updateBookRelationships = async (
    connection,
    bookId,
    book
) => {

    // =============================================
    // AUTHORS
    // =============================================

    for (
        let index = 0;
        index < book.authors.length;
        index++
    ) {

        const authorName =
            book.authors[index];

        const authorKey =
            book.authorKeys[index] ||
            null;

        const authorId =
            await insertAuthor(
                connection,
                authorName,
                authorKey
            );


        if (authorId) {

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


    // =============================================
    // SUBJECTS
    // =============================================

    for (
        const subject of book.subjects
    ) {

        const subjectId =
            await insertSubject(
                connection,
                subject
            );


        if (subjectId) {

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
};


// =====================================================
// IMPORT ERROR LOG
// =====================================================

const logImportError = async (
    connection,
    jobId,
    recordIdentifier,
    error
) => {

    try {

        await connection.execute(
            `
            INSERT INTO import_errors
            (
                import_job_id,
                record_identifier,
                error_message
            )
            VALUES (?, ?, ?)
            `,
            [
                jobId,
                recordIdentifier || null,
                error?.message || "Unknown import error"
            ]
        );

    } catch (logError) {

        console.error(
            "IMPORT ERROR LOG FAILED:",
            logError.message
        );
    }
};


// =====================================================
// IMPORT BOOKS
// STEP 11 - IMPORT JOB TRACKING
// =====================================================

export const importBooks = async (
    count,
    adminId = null,
    options = {}
) => {

    const keyword =
        typeof options.keyword === "string"
            ? options.keyword.trim()
            : "";

    const subject =
        typeof options.subject === "string"
            ? options.subject.trim()
            : "";


    // =============================================
    // VALIDATE SEARCH
    // =============================================

    if (
        !keyword &&
        !subject
    ) {

        const error =
            new Error(
                "Keyword or subject is required"
            );

        error.statusCode = 400;

        throw error;
    }


    // =============================================
    // VALIDATE COUNT
    // =============================================

    const importCount =
        validateImportSize(count);


    // =============================================
    // CREATE IMPORT JOB
    // =============================================

    const jobId =
        await createImportJob({
            adminId,
            requestedCount: importCount
        });


    console.log(
        `Import Job ${jobId} started`
    );


    // =============================================
    // DATABASE CONNECTION
    // =============================================

    const connection =
        await pool.getConnection();


    // =============================================
    // SUMMARY
    // =============================================

    const summary = {

        requested:
            importCount,

        fetched:
            0,

        processed:
            0,

        inserted:
            0,

        updated:
            0,

        duplicates:
            0,

        skipped:
            0,

        failed:
            0
    };


    try {

        // =============================================
        // START TRANSACTION
        // =============================================

        await connection.beginTransaction();


        // =============================================
        // FETCH BOOKS IN SMALL BATCHES
        // =============================================

        const books = [];

        const pageSize = 100;

        const totalPages =
            Math.ceil(
                importCount / pageSize
            );


        for (
            let page = 1;
            page <= totalPages;
            page++
        ) {

            const remaining =
                importCount -
                books.length;

            const limit =
                Math.min(
                    pageSize,
                    remaining
                );


            const query =
                keyword ||
                (
                    subject
                        ? ""
                        : IMPORT_SEARCH_QUERIES[
                            (page - 1) %
                            IMPORT_SEARCH_QUERIES.length
                        ]
                );


            console.log(
                `Fetching Open Library page ${page}/${totalPages}`
            );

            console.log(
                `Query: ${query}`
            );

            console.log(
                `Subject: ${subject || "none"}`
            );

            console.log(
                `Limit: ${limit}`
            );


            const result =
                await searchBooks({
                    query,
                    keyword,
                    subject,
                    page,
                    limit
                });


            const docs =
                Array.isArray(result?.docs)
                    ? result.docs
                    : [];


            console.log(
                `Received ${docs.length} books`
            );
            if (docs.length === 0) {
                    console.log(
                        "Open Library returned no more records. Stopping pagination."
                    );

                    break;
                }


            books.push(
                ...docs
            );


            summary.fetched =
                books.length;


            if (
                books.length >=
                importCount
            ) {
                break;
            }
            if (docs.length < limit) {
                    console.log(
                        `Short page received: ${docs.length} of ${limit}. Stopping pagination.`
                    );

                    break;
                }
        }


        // =============================================
        // PROCESS BOOKS
        // =============================================

        for (
            const rawBook of books.slice(
                0,
                importCount
            )
        ) {

            summary.processed++;


            try {

                // =============================================
                // NORMALIZE
                // =============================================

                const normalizedBook =
                    normalizeBook(
                        rawBook
                    );


                if (!normalizedBook) {

                    summary.skipped++;

                    await updateImportJob(
                        jobId,
                        summary
                    );

                    continue;
                }


                // =============================================
                // CLEAN + VALIDATE
                // =============================================

                const validation =
                    cleanAndValidateBook(
                        normalizedBook
                    );


                if (!validation.valid) {

                    summary.skipped++;


                    console.log(
                        `Skipped book: ${normalizedBook.title}`
                    );


                    console.log(
                        "Validation errors:",
                        validation.errors
                    );


                    await logImportError(
                        connection,
                        jobId,
                        normalizedBook.openLibraryKey ||
                        normalizedBook.title,
                        new Error(
                            validation.errors.join("; ")
                        )
                    );


                    await updateImportJob(
                        jobId,
                        summary
                    );


                    continue;
                }


                const book =
                    validation.book;


                // =============================================
                // CHECK DUPLICATE
                // =============================================

                const existingBook =
                    await findExistingBook(
                        connection,
                        book
                    );


                // =============================================
                // UPSERT
                // =============================================

                const result =
                    await upsertBook(
                        connection,
                        book
                    );


                // =============================================
                // RELATIONSHIPS
                // =============================================

                await updateBookRelationships(
                    connection,
                    result.id,
                    book
                );


                // =============================================
                // SUMMARY
                // =============================================

                if (
                    result.action === "inserted"
                ) {

                    summary.inserted++;

                } else {

                    summary.updated++;


                    if (existingBook) {

                        summary.duplicates++;
                    }
                }


                // =============================================
                // UPDATE JOB PROGRESS
                // =============================================

                await updateImportJob(
                    jobId,
                    summary
                );


            } catch (error) {

                console.error(
                    `Book import failed: ${error.message}`
                );


                summary.failed++;


                await logImportError(
                    connection,
                    jobId,
                    rawBook?.key ||
                    rawBook?.title ||
                    null,
                    error
                );


                await updateImportJob(
                    jobId,
                    summary
                );
            }
        }


        // =============================================
        // COMMIT
        // =============================================

        await connection.commit();


        // =============================================
        // FINAL IMPORT STATUS
        // =============================================

        /*
         * CASE 1:
         * No records were processed.
         * This means the import failed completely.
         */

        if (
            summary.processed === 0
        ) {

            await failImportJob(
                jobId,
                new Error(
                    "No records were successfully processed"
                )
            );


        /*
         * CASE 2:
         * Every processed record failed.
         */

        } else if (
            summary.failed === summary.processed
        ) {

            await failImportJob(
                jobId,
                new Error(
                    "All processed records failed"
                )
            );


        /*
         * CASE 3:
         * Some records failed but some succeeded/skipped.
         */

        } else if (
            summary.failed > 0
        ) {

            await updateImportJob(
                jobId,
                {
                    ...summary,
                    status: "partially_completed"
                }
            );


        /*
         * CASE 4:
         * No failures.
         * Import completed successfully.
         */

        } else {

            await completeImportJob(
                jobId,
                summary
            );
        }


        console.log(
            "======================================"
        );

        console.log(
            "BOOK IMPORT COMPLETED"
        );

        console.log(
            "IMPORT JOB:",
            jobId
        );

        console.log(
            "FINAL IMPORT STATUS:"
        );

        console.log(
            summary
        );

        console.log(
            "======================================"
        );


        return {

            ...summary,

            jobId

        };


    } catch (error) {

        // =============================================
        // ROLLBACK
        // =============================================

        await connection.rollback();


        console.error(
            "Book import transaction failed:",
            error
        );


        // =============================================
        // MARK JOB FAILED
        // =============================================

        try {

            await failImportJob(
                jobId,
                error
            );

        } catch (jobError) {

            console.error(
                "Failed to update import job:",
                jobError.message
            );
        }


        throw error;


    } finally {

        // =============================================
        // RELEASE CONNECTION
        // =============================================

        connection.release();
    }
};


// =====================================================
// MAP OPEN LIBRARY BOOK
// =====================================================

export const mapOpenLibraryBook = (doc) => {

    if (
        !doc ||
        typeof doc !== "object"
    ) {
        return null;
    }


    const isbnList =
        Array.isArray(doc.isbn)
            ? doc.isbn
            : [];


    const isbn10 =
        isbnList.find(
            (isbn) => {

                const value =
                    String(isbn)
                        .replace(
                            /[-\s]/g,
                            ""
                        );

                return value.length === 10;
            }
        ) || null;


    const isbn13 =
        isbnList.find(
            (isbn) => {

                const value =
                    String(isbn)
                        .replace(
                            /[-\s]/g,
                            ""
                        );

                return value.length === 13;
            }
        ) || null;


    const publishers =
        Array.isArray(doc.publisher)
            ? doc.publisher
            : [];


    const subjects =
        Array.isArray(doc.subject)
            ? doc.subject
            : [];


    return {

        openLibraryKey:
            doc.key || null,

        title:
            doc.title || null,

        subtitle:
            doc.subtitle || null,

        isbn10,

        isbn13,

        publisher:
            publishers.length > 0
                ? publishers[0]
                : null,

        publishDate:
            Array.isArray(doc.publish_date)
                ? doc.publish_date[0]
                : doc.publish_date || null,

        firstPublishYear:
            doc.first_publish_year || null,

        language:
            Array.isArray(doc.language)
                ? doc.language[0]
                : doc.language || null,

        description:
            typeof doc.description === "string"
                ? doc.description
                : (
                    doc.description &&
                    typeof doc.description.value === "string"
                        ? doc.description.value
                        : null
                ),

        coverUrl:
            doc.cover_i
                ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
                : null,

        pageCount:
            doc.number_of_pages_median || null,

        authors:
            Array.isArray(doc.author_name)
                ? doc.author_name
                : [],

        authorKeys:
            Array.isArray(doc.author_key)
                ? doc.author_key
                : [],

        subjects
    };
};