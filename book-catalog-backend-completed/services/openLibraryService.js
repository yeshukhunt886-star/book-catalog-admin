import axios from "axios";

const OPEN_LIBRARY_URL =
    "https://openlibrary.org/search.json";

// =====================================================
// CONFIGURATION
// =====================================================

const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

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
        const error = new Error(
            "Either keyword or subject is required"
        );

        error.statusCode = 400;
        throw error;
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
                const error = new Error(
                    "Invalid response from Open Library"
                );

                error.statusCode = 502;
                throw error;
            }

            // IMPORTANT:
            // Do not slice the records here.
            // The import service controls pagination.
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

                const status =
                    error.response.status;

                console.error(
                    "Open Library API Error:",
                    status,
                    error.response.data
                );

                // Rate limit from Open Library
                if (status === 429) {

                    const rateLimitError =
                        new Error(
                            "Open Library rate limit reached. Please try again later."
                        );

                    rateLimitError.statusCode = 429;

                    throw rateLimitError;
                }

                // Retry temporary server errors
                if (
                    status >= 500 &&
                    attempt < MAX_RETRIES
                ) {

                    console.log(
                        `Open Library server error. Retrying in ${RETRY_DELAY}ms...`
                    );

                    await sleep(
                        RETRY_DELAY
                    );

                    continue;
                }

                const apiError =
                    new Error(
                        `Open Library API failed with status ${status}`
                    );

                apiError.statusCode = 502;

                throw apiError;
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

                    await sleep(
                        RETRY_DELAY
                    );

                    continue;
                }

                const timeoutError =
                    new Error(
                        "Open Library API request timed out. Please try again later."
                    );

                timeoutError.statusCode = 504;

                throw timeoutError;
            }

            // =================================================
            // NETWORK ERROR
            // =================================================

            if (
                error.code === "ENOTFOUND" ||
                error.code === "ECONNREFUSED"
            ) {

                console.error(
                    "Open Library network error:",
                    error.code
                );

                const networkError =
                    new Error(
                        "Unable to connect to Open Library. The third-party API may be unavailable."
                    );

                networkError.statusCode = 503;

                throw networkError;
            }

            if (
                error.code === "ECONNRESET"
            ) {

                console.error(
                    "Open Library connection reset"
                );

                if (
                    attempt < MAX_RETRIES
                ) {

                    await sleep(
                        RETRY_DELAY
                    );

                    continue;
                }

                const networkError =
                    new Error(
                        "Connection to Open Library was reset. Please try again later."
                    );

                networkError.statusCode = 503;

                throw networkError;
            }

            // =================================================
            // UNKNOWN ERROR
            // =================================================

            console.error(
                "Open Library unexpected error:",
                error
            );

            const unknownError =
                new Error(
                    `Unable to connect to Open Library: ${error.message}`
                );

            unknownError.statusCode = 503;

            throw unknownError;
        }
    }

    // =================================================
    // FINAL FALLBACK
    // =================================================

    const finalError =
        new Error(
            lastError?.message ||
            "Open Library request failed"
        );

    finalError.statusCode =
        lastError?.statusCode || 503;

    throw finalError;
};

// =====================================================
// SEARCH BY KEYWORD
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

        const error =
            new Error(
                "Keyword is required"
            );

        error.statusCode = 400;

        throw error;
    }

    const cleanKeyword =
        keyword.trim();

    // Minimum 2 characters
    if (
        cleanKeyword.length < 2
    ) {

        const error =
            new Error(
                "Keyword must contain at least 2 characters"
            );

        error.statusCode = 400;

        throw error;
    }

    return await searchOpenLibrary({
        keyword: cleanKeyword,
        page,
        limit
    });
};

// =====================================================
// SEARCH BY SUBJECT
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

        const error =
            new Error(
                "Subject is required"
            );

        error.statusCode = 400;

        throw error;
    }

    return await searchOpenLibrary({
        subject: subject.trim(),
        page,
        limit
    });
};

// =====================================================
// FETCH BOOK DATA
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