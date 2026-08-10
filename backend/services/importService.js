import pool from "../config/db.js";

import {
    searchBooks
} from "./openLibraryService.js";

import {
    cleanAndValidateBook
} from "../utils/bookValidator.js";


/*
=====================================================
ALLOWED IMPORT SIZES
=====================================================
*/

const ALLOWED_IMPORT_SIZES = [
    100,
    500,
    1000
];


/*
=====================================================
IMPORT SEARCH QUERIES
=====================================================
*/

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


/*
=====================================================
VALIDATE IMPORT SIZE
=====================================================
*/

export const validateImportSize = (count) => {
    const importCount = Number(count);

    if (
        !ALLOWED_IMPORT_SIZES.includes(
            importCount
        )
    ) {
        const error = new Error(
            "Import count must be 100, 500, or 1000"
        );

        error.statusCode = 400;

        throw error;
    }

    return importCount;
};


/*
=====================================================
NORMALIZE OPEN LIBRARY BOOK
=====================================================
*/

const normalizeBook = (book) => {
    if (!book || typeof book !== "object") {
        return null;
    }

    const title =
        typeof book.title === "string"
            ? book.title.trim()
            : null;

    if (!title) {
        return null;
    }


    /*
    OPEN LIBRARY KEY
    */

    const openLibraryKey =
        typeof book.key === "string"
            ? book.key.trim()
            : null;


    /*
    ISBN
    */

    const isbnList =
        Array.isArray(book.isbn)
            ? book.isbn
            : [];

    const isbn10 =
        isbnList.find(
            (isbn) =>
                typeof isbn === "string" &&
                isbn.replace(
                    /[-\s]/g,
                    ""
                ).length === 10
        ) || null;

    const isbn13 =
        isbnList.find(
            (isbn) =>
                typeof isbn === "string" &&
                isbn.replace(
                    /[-\s]/g,
                    ""
                ).length === 13
        ) || null;


    /*
    PUBLISHER
    */

    const publisher =
        Array.isArray(book.publisher) &&
        book.publisher.length > 0
            ? String(
                book.publisher[0]
            ).trim()
            : null;


    /*
    PUBLISH DATE
    */

    let publishDate = null;

    if (
        Array.isArray(book.publish_date) &&
        book.publish_date.length > 0
    ) {
        publishDate =
            String(
                book.publish_date[0]
            ).trim();
    }


    /*
    FIRST PUBLISH YEAR
    */

    const firstPublishYear =
        Number.isInteger(
            book.first_publish_year
        )
            ? book.first_publish_year
            : null;


    /*
    COVER
    */

    const coverUrl =
        book.cover_i
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
            : null;


    /*
    LANGUAGE
    */

    let language = null;

    if (
        Array.isArray(book.language) &&
        book.language.length > 0
    ) {
        language =
            String(
                book.language[0]
            ).trim();
    }


    /*
    PAGE COUNT
    */

    const pageCount =
        Number.isInteger(
            book.number_of_pages_median
        )
            ? book.number_of_pages_median
            : null;


    /*
    AUTHORS
    */

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


    /*
    AUTHOR KEYS
    */

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


    /*
    SUBJECTS
    */

    const subjects =
        Array.isArray(book.subject)
            ? book.subject
                .filter(
                    (subject) =>
                        typeof subject === "string"
                )
                .map(
                    (subject) =>
                        subject.trim()
                )
                .filter(Boolean)
                .slice(0, 30)
            : [];


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

        coverUrl,

        pageCount,

        authors,

        authorKeys,

        subjects
    };
};


/*
=====================================================
INSERT AUTHOR
=====================================================
*/

const insertAuthor = async (
    connection,
    name,
    openLibraryKey = null
) => {
    if (!name || !name.trim()) {
        return null;
    }

    const cleanName =
        name.trim();


    /*
    FIND BY OPEN LIBRARY KEY
    */

    if (openLibraryKey) {
        const [existing] =
            await connection.execute(
                `
                SELECT id
                FROM authors
                WHERE open_library_key = ?
                LIMIT 1
                `,
                [openLibraryKey]
            );

        if (existing.length > 0) {
            return existing[0].id;
        }
    }


    /*
    FIND BY NAME
    */

    const [existingByName] =
        await connection.execute(
            `
            SELECT id
            FROM authors
            WHERE name = ?
            LIMIT 1
            `,
            [cleanName]
        );

    if (existingByName.length > 0) {
        return existingByName[0].id;
    }


    /*
    INSERT
    */

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


/*
=====================================================
INSERT SUBJECT
=====================================================
*/

const insertSubject = async (
    connection,
    name
) => {
    if (!name || !name.trim()) {
        return null;
    }

    const cleanName =
        name.trim();


    /*
    FIND EXISTING
    */

    const [existing] =
        await connection.execute(
            `
            SELECT id
            FROM subjects
            WHERE name = ?
            LIMIT 1
            `,
            [cleanName]
        );

    if (existing.length > 0) {
        return existing[0].id;
    }


    /*
    INSERT
    */

    const [result] =
        await connection.execute(
            `
            INSERT INTO subjects
            (
                name
            )
            VALUES (?)
            `,
            [cleanName]
        );

    return result.insertId;
};


/*
=====================================================
FIND EXISTING BOOK
=====================================================
*/

const findExistingBook = async (
    connection,
    book
) => {
    /*
    OPEN LIBRARY KEY
    */

    if (book.openLibraryKey) {
        const [rows] =
            await connection.execute(
                `
                SELECT id
                FROM books
                WHERE open_library_key = ?
                LIMIT 1
                `,
                [book.openLibraryKey]
            );

        if (rows.length > 0) {
            return rows[0];
        }
    }


    /*
    ISBN13
    */

    if (book.isbn13) {
        const [rows] =
            await connection.execute(
                `
                SELECT id
                FROM books
                WHERE isbn13 = ?
                LIMIT 1
                `,
                [book.isbn13]
            );

        if (rows.length > 0) {
            return rows[0];
        }
    }


    /*
    ISBN10
    */

    if (book.isbn10) {
        const [rows] =
            await connection.execute(
                `
                SELECT id
                FROM books
                WHERE isbn10 = ?
                LIMIT 1
                `,
                [book.isbn10]
            );

        if (rows.length > 0) {
            return rows[0];
        }
    }

    return null;
};


/*
=====================================================
INSERT BOOK
=====================================================
*/

const insertBook = async (
    connection,
    book
) => {
    const existingBook =
        await findExistingBook(
            connection,
            book
        );


    /*
    DUPLICATE
    */

    if (existingBook) {
        return {
            id: existingBook.id,
            inserted: false,
            duplicate: true
        };
    }


    /*
    INSERT BOOK
    */

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
                cover_url,
                page_count,
                data_source
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                book.coverUrl,
                book.pageCount,
                "Open Library"
            ]
        );

    return {
        id: result.insertId,
        inserted: true,
        duplicate: false
    };
};


/*
=====================================================
CREATE BOOK RELATIONSHIPS
=====================================================
*/

const createBookRelationships = async (
    connection,
    bookId,
    book
) => {
    /*
    AUTHORS
    */

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


    /*
    SUBJECTS
    */

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


/*
=====================================================
IMPORT BOOKS
=====================================================
*/

export const importBooks = async (count) => {
    const importCount =
        validateImportSize(count);

    const connection =
        await pool.getConnection();

    const summary = {
        requested: importCount,
        fetched: 0,
        imported: 0,
        duplicates: 0,
        skipped: 0,
        failed: 0
    };

    try {
        await connection.beginTransaction();


        /*
        =============================================
        FETCH BOOKS
        =============================================
        */

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
                IMPORT_SEARCH_QUERIES[
                    (page - 1) %
                    IMPORT_SEARCH_QUERIES.length
                ];

            console.log(
                `Fetching Open Library page ${page}/${totalPages}`
            );

            console.log(
                `Query: ${query}`
            );

            console.log(
                `Limit: ${limit}`
            );

            const result =
                await searchBooks({
                    query,
                    page,
                    limit
                });

            const docs =
                result.docs || [];

            console.log(
                `Received ${docs.length} books`
            );

            if (docs.length === 0) {
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
        }


        /*
        =============================================
        PROCESS BOOKS
        =============================================
        */

        for (
            const rawBook of books.slice(
                0,
                importCount
            )
        ) {
            try {

                /*
                -------------------------------------
                NORMALIZE
                -------------------------------------
                */

                const normalizedBook =
                    normalizeBook(
                        rawBook
                    );

                if (!normalizedBook) {
                    summary.skipped++;

                    console.log(
                        "Skipped: unable to normalize book"
                    );

                    continue;
                }


                /*
                -------------------------------------
                CLEAN + VALIDATE
                -------------------------------------
                */

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

                    continue;
                }

                const book =
                    validation.book;


                /*
                -------------------------------------
                INSERT BOOK
                -------------------------------------
                */

                const result =
                    await insertBook(
                        connection,
                        book
                    );


                /*
                -------------------------------------
                DUPLICATE
                -------------------------------------
                */

                if (result.duplicate) {
                    summary.duplicates++;

                    continue;
                }


                /*
                -------------------------------------
                AUTHORS + SUBJECTS
                -------------------------------------
                */

                await createBookRelationships(
                    connection,
                    result.id,
                    book
                );

                summary.imported++;

            } catch (error) {

                console.error(
                    "Book import failed:",
                    error.message
                );

                summary.failed++;
            }
        }


        /*
        =============================================
        COMMIT
        =============================================
        */

        await connection.commit();

        return summary;

    } catch (error) {

        /*
        =============================================
        ROLLBACK
        =============================================
        */

        await connection.rollback();

        throw error;

    } finally {

        connection.release();
    }
};