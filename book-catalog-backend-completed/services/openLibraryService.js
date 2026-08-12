import axios from "axios";

const OPEN_LIBRARY_URL =
    "https://openlibrary.org/search.json";

// =====================================================
// CONFIGURATION
// =====================================================

const REQUEST_TIMEOUT = 60000; // 60 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// =====================================================
// WAIT HELPER
// =====================================================

const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

// =====================================================
// NORMALIZE OPEN LIBRARY BOOK
// =====================================================

export const normalizeOpenLibraryBook = (book) => {
    return {
        open_library_id:
            book.key?.replace("/works/", "") || null,

        title:
            book.title?.trim() || null,

        authors:
            Array.isArray(book.author_name)
                ? book.author_name
                : [],

        author_keys:
            Array.isArray(book.author_key)
                ? book.author_key
                : [],

        subjects:
            Array.isArray(book.subject)
                ? book.subject
                : [],

        isbn10:
            Array.isArray(book.isbn)
                ? book.isbn.find(
                    (isbn) =>
                        String(isbn)
                            .replace(/[-\s]/g, "")
                            .length === 10
                ) || null
                : null,

        isbn13:
            Array.isArray(book.isbn)
                ? book.isbn.find(
                    (isbn) =>
                        String(isbn)
                            .replace(/[-\s]/g, "")
                            .length === 13
                ) || null
                : null,

        publisher:
            Array.isArray(book.publisher)
                ? book.publisher[0] || null
                : null,

        publish_date:
            Array.isArray(book.publish_date)
                ? book.publish_date[0] || null
                : null,

        first_publish_year:
            book.first_publish_year || null,

        language:
            Array.isArray(book.language)
                ? book.language[0] || null
                : null,

        page_count:
            book.number_of_pages_median || null,

        cover_id:
            book.cover_i || null,

        cover_url:
            book.cover_i
                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
                : null,

        data_source:
            "Open Library"
    };
};

// =====================================================
// SEARCH OPEN LIBRARY
// =====================================================

const searchOpenLibrary = async ({
    keyword = "",
    subject = "",
    page = 1,
    limit = 100
}) => {

    if (!keyword && !subject) {
        throw new Error(
            "Either keyword or subject is required"
        );
    }

    // =================================================
    // LIMIT SAFETY
    // =================================================

    const safeLimit = Math.min(
        Math.max(Number(limit) || 100, 1),
        100
    );

    const safePage = Math.max(
        Number(page) || 1,
        1
    );

    const params = {
        page: safePage,
        limit: safeLimit
    };

    // =================================================
    // KEYWORD SEARCH
    // =================================================

    if (keyword) {
        params.q = keyword;
    }

    // =================================================
    // SUBJECT SEARCH
    // =================================================

    if (subject) {
        params.subject = subject;
    }

    // =================================================
    // RETRY LOOP
    // =================================================

    let lastError = null;

    for (
        let attempt = 1;
        attempt <= MAX_RETRIES;
        attempt++
    ) {

        try {

            console.log(
                `Open Library request attempt ${attempt}/${MAX_RETRIES}`
            );

            console.log(
                "Open Library params:",
                params
            );

            const response = await axios.get(
                OPEN_LIBRARY_URL,
                {
                    params,

                    timeout: REQUEST_TIMEOUT,

                    headers: {
                        Accept: "application/json",
                        "User-Agent":
                            "Book-Catalog-Admin-Portal/1.0"
                    }
                }
            );

            // =================================================
            // RESPONSE VALIDATION
            // =================================================

            if (
                !response ||
                !response.data
            ) {
                throw new Error(
                    "Invalid response from Open Library"
                );
            }

            const docs =
                Array.isArray(response.data.docs)
                    ? response.data.docs
                    : [];

            // =================================================
            // EMPTY RESULT
            // =================================================

            if (docs.length === 0) {

                console.log(
                    "Open Library returned no books"
                );

                return {
                    success: true,

                    message:
                        "No books found",

                    total: 0,

                    page: safePage,

                    limit: safeLimit,

                    books: [],

                    docs: []
                };
            }

            // =================================================
            // NORMALIZE
            // =================================================

            const books =
                docs.map(
                    normalizeOpenLibraryBook
                );

            console.log(
                `Open Library returned ${books.length} books`
            );

            return {
                success: true,

                message:
                    "Books fetched successfully",

                total:
                    response.data.numFound ||
                    books.length,

                page: safePage,

                limit: safeLimit,

                books,

                // Keep docs for importService compatibility
                docs
            };

        } catch (error) {

            lastError = error;

            // =================================================
            // HTTP ERROR
            // =================================================

            if (error.response) {

                console.error(
                    "Open Library API Error:",
                    error.response.status,
                    error.response.data
                );

                // Retry temporary server errors
                if (
                    error.response.status >= 500 &&
                    attempt < MAX_RETRIES
                ) {

                    console.log(
                        `Open Library server error. Retrying in ${RETRY_DELAY}ms...`
                    );

                    await sleep(RETRY_DELAY);

                    continue;
                }

                throw new Error(
                    `Open Library API failed with status ${error.response.status}`
                );
            }

            // =================================================
            // TIMEOUT
            // =================================================

            if (
                error.code === "ECONNABORTED" ||
                error.code === "ETIMEDOUT"
            ) {

                console.error(
                    `Open Library API timeout on attempt ${attempt}/${MAX_RETRIES}`
                );

                if (
                    attempt < MAX_RETRIES
                ) {

                    console.log(
                        `Retrying Open Library request in ${RETRY_DELAY}ms...`
                    );

                    await sleep(RETRY_DELAY);

                    continue;
                }

                throw new Error(
                    "Open Library API request timed out after multiple attempts"
                );
            }

            // =================================================
            // NETWORK ERROR
            // =================================================

            if (
                error.code === "ENOTFOUND" ||
                error.code === "ECONNRESET" ||
                error.code === "ECONNREFUSED"
            ) {

                console.error(
                    "Open Library network error:",
                    error.code
                );

                if (
                    attempt < MAX_RETRIES
                ) {

                    console.log(
                        `Retrying Open Library request in ${RETRY_DELAY}ms...`
                    );

                    await sleep(RETRY_DELAY);

                    continue;
                }

                throw new Error(
                    `Unable to connect to Open Library: ${error.message}`
                );
            }

            // =================================================
            // UNKNOWN ERROR
            // =================================================

            console.error(
                "Open Library unexpected error:",
                error
            );

            throw new Error(
                `Unable to connect to Open Library: ${error.message}`
            );
        }
    }

    // =================================================
    // FINAL FALLBACK
    // =================================================

    throw new Error(
        lastError?.message ||
        "Open Library request failed"
    );
};

// =====================================================
// 7.1 SEARCH BY KEYWORD
// =====================================================

export const searchBooksByKeyword = async (
    keyword,
    page = 1,
    limit = 100
) => {

    if (
        !keyword ||
        !keyword.trim()
    ) {
        throw new Error(
            "Keyword is required"
        );
    }

    return await searchOpenLibrary({
        keyword: keyword.trim(),
        page,
        limit
    });
};

// =====================================================
// 7.2 SEARCH BY SUBJECT
// =====================================================

export const searchBooksBySubject = async (
    subject,
    page = 1,
    limit = 100
) => {

    if (
        !subject ||
        !subject.trim()
    ) {
        throw new Error(
            "Subject is required"
        );
    }

    return await searchOpenLibrary({
        subject: subject.trim(),
        page,
        limit
    });
};

// =====================================================
// 7.3 FETCH BOOK DATA
// =====================================================

export const fetchBookData = async ({
    keyword = "",
    subject = "",
    page = 1,
    limit = 100
}) => {

    return await searchOpenLibrary({
        keyword,
        subject,
        page,
        limit
    });
};

// =====================================================
// BACKWARD COMPATIBILITY
// =====================================================
// importService.js currently uses searchBooks().
// Keep this alias so existing import code continues working.
// =====================================================

export const searchBooks = async ({
    query = "",
    keyword = "",
    subject = "",
    page = 1,
    limit = 100
}) => {

    return await searchOpenLibrary({
        keyword:
            keyword || query,

        subject,

        page,

        limit
    });
};