// =====================================================
// BOOK VALIDATOR
// STEP 12.6 — BOOK VALIDATION
// =====================================================

// =====================================================
// CLEAN STRING
// =====================================================

const cleanString = (value) => {
    if (
        value === undefined ||
        value === null
    ) {
        return null;
    }

    if (typeof value !== "string") {
        return null;
    }

    const cleaned = value.trim();

    return cleaned || null;
};

// =====================================================
// ISBN-10 VALIDATION
// =====================================================

const isValidISBN10 = (isbn) => {
    if (!isbn) {
        return true;
    }

    // ISBN-10 may contain digits or X as check digit
    return /^\d{9}[\dX]$/.test(isbn);
};

// =====================================================
// ISBN-13 VALIDATION
// =====================================================

const isValidISBN13 = (isbn) => {
    if (!isbn) {
        return true;
    }

    return /^\d{13}$/.test(isbn);
};

// =====================================================
// YEAR VALIDATION
// =====================================================

const isValidYear = (year) => {
    if (
        year === null ||
        year === undefined ||
        year === ""
    ) {
        return true;
    }

    return (
        Number.isInteger(Number(year)) &&
        Number(year) > 0 &&
        Number(year) <= new Date().getFullYear()
    );
};

// =====================================================
// PAGE COUNT VALIDATION
// =====================================================

const isValidPageCount = (pageCount) => {
    if (
        pageCount === null ||
        pageCount === undefined ||
        pageCount === ""
    ) {
        return true;
    }

    return (
        Number.isInteger(Number(pageCount)) &&
        Number(pageCount) >= 0
    );
};

// =====================================================
// ARRAY CLEANER
// =====================================================

const cleanArray = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return [
        ...new Set(
            value
                .filter(
                    (item) =>
                        typeof item === "string"
                )
                .map(
                    (item) =>
                        item.trim()
                )
                .filter(Boolean)
        )
    ];
};

// =====================================================
// AUTHOR KEY CLEANER
// =====================================================

const cleanAuthorKeys = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter(
            (key) =>
                typeof key === "string"
        )
        .map(
            (key) =>
                key.trim()
        )
        .filter(Boolean);
};

// =====================================================
// VALIDATE BOOK
// =====================================================

export const validateBook = (data = {}) => {

    const errors = [];

    // =================================================
    // TITLE
    // =================================================

    const title =
        cleanString(data.title);

    if (!title) {
        errors.push(
            "Title is required"
        );
    }

    if (
        title &&
        title.length > 500
    ) {
        errors.push(
            "Title must not exceed 500 characters"
        );
    }

    // =================================================
    // SUBTITLE
    // =================================================

    const subtitle =
        cleanString(data.subtitle);

    // =================================================
    // OPEN LIBRARY KEY
    // =================================================

    const openLibraryKey =
        cleanString(
            data.open_library_key
        );

    // =================================================
    // ISBN-10
    // =================================================

    let isbn10 =
        cleanString(data.isbn10);

    if (isbn10) {

        isbn10 =
            isbn10
                .replace(
                    /[-\s]/g,
                    ""
                )
                .toUpperCase();

        if (
            !isValidISBN10(isbn10)
        ) {
            errors.push(
                "ISBN-10 must contain exactly 10 characters"
            );
        }
    }

    // =================================================
    // ISBN-13
    // =================================================

    let isbn13 =
        cleanString(data.isbn13);

    if (isbn13) {

        isbn13 =
            isbn13
                .replace(
                    /[-\s]/g,
                    ""
                );

        if (
            !isValidISBN13(isbn13)
        ) {
            errors.push(
                "ISBN-13 must contain exactly 13 digits"
            );
        }
    }

    // =================================================
    // PUBLISHER
    // =================================================

    const publisher =
        cleanString(data.publisher);

    // =================================================
    // PUBLISH DATE
    // =================================================

    const publishDate =
        cleanString(
            data.publish_date
        );

    // =================================================
    // FIRST PUBLISH YEAR
    // =================================================

    let firstPublishYear =
        data.first_publish_year;

    if (
        firstPublishYear !== undefined &&
        firstPublishYear !== null &&
        firstPublishYear !== ""
    ) {

        firstPublishYear =
            Number(firstPublishYear);

        if (
            !isValidYear(
                firstPublishYear
            )
        ) {
            errors.push(
                "Invalid publish year"
            );
        }

    } else {

        firstPublishYear = null;
    }

    // =================================================
    // LANGUAGE
    // =================================================

    const language =
        cleanString(data.language);

    // =================================================
    // DESCRIPTION
    // =================================================

    const description =
        cleanString(data.description);

    // =================================================
    // COVER URL
    // =================================================

    const coverUrl =
        cleanString(data.cover_url);

    if (
        coverUrl &&
        !/^https?:\/\/.+/i.test(
            coverUrl
        )
    ) {
        errors.push(
            "Cover URL must be a valid HTTP or HTTPS URL"
        );
    }

    // =================================================
    // PAGE COUNT
    // =================================================

    let pageCount =
        data.page_count;

    if (
        pageCount !== undefined &&
        pageCount !== null &&
        pageCount !== ""
    ) {

        pageCount =
            Number(pageCount);

        if (
            !isValidPageCount(
                pageCount
            )
        ) {
            errors.push(
                "Page count must be a non-negative integer"
            );
        }

    } else {

        pageCount = null;
    }

    // =================================================
    // DATA SOURCE
    // =================================================

    const dataSource =
        cleanString(
            data.data_source
        ) || "Manual";

    // =================================================
    // AUTHORS
    // =================================================

    const authors =
        cleanArray(
            data.authors
        );

    // =================================================
    // AUTHOR KEYS
    // IMPORTANT:
    // Preserve authorKeys for importService.js
    // =================================================

    const authorKeys =
        cleanAuthorKeys(
            data.author_keys
        );

    // =================================================
    // SUBJECTS
    // =================================================

    const subjects =
        cleanArray(
            data.subjects
        );

    // =================================================
    // RETURN VALIDATION RESULT
    // =================================================

    if (
        errors.length > 0
    ) {

        return {
            valid: false,
            errors,
            book: null
        };
    }

    return {

        valid: true,

        errors: [],

        book: {

            open_library_key:
                openLibraryKey,

            title,

            subtitle,

            isbn10,

            isbn13,

            publisher,

            publish_date:
                publishDate,

            first_publish_year:
                firstPublishYear,

            language,

            description,

            cover_url:
                coverUrl,

            page_count:
                pageCount,

            data_source:
                dataSource,

            authors,

            // IMPORTANT
            // Keep author keys after validation
            author_keys:
                authorKeys,

            subjects
        }
    };
};

// =====================================================
// CLEAN + VALIDATE BOOK
// Used by Import Service
// =====================================================

export const cleanAndValidateBook = (
    book = {}
) => {

    const data = {

        open_library_key:
            book.openLibraryKey ??
            book.open_library_key,

        title:
            book.title,

        subtitle:
            book.subtitle,

        isbn10:
            book.isbn10,

        isbn13:
            book.isbn13,

        publisher:
            book.publisher,

        publish_date:
            book.publishDate ??
            book.publish_date,

        first_publish_year:
            book.firstPublishYear ??
            book.first_publish_year,

        language:
            book.language,

        description:
            book.description,

        cover_url:
            book.coverUrl ??
            book.cover_url,

        page_count:
            book.pageCount ??
            book.page_count,

        data_source:
            book.dataSource ??
            book.data_source ??
            "Open Library",

        authors:
            book.authors,

        // IMPORTANT
        // Pass authorKeys into validator
        author_keys:
            book.authorKeys ??
            book.author_keys,

        subjects:
            book.subjects
    };

    const result =
        validateBook(data);

    if (
        !result.valid
    ) {

        return {
            valid: false,
            errors: result.errors,
            book: null
        };
    }

    return {

        valid: true,

        errors: [],

        book: {

            openLibraryKey:
                result.book.open_library_key,

            title:
                result.book.title,

            subtitle:
                result.book.subtitle,

            isbn10:
                result.book.isbn10,

            isbn13:
                result.book.isbn13,

            publisher:
                result.book.publisher,

            publishDate:
                result.book.publish_date,

            firstPublishYear:
                result.book.first_publish_year,

            language:
                result.book.language,

            description:
                result.book.description,

            coverUrl:
                result.book.cover_url,

            pageCount:
                result.book.page_count,

            dataSource:
                result.book.data_source,

            authors:
                result.book.authors,

            // IMPORTANT
            // Return authorKeys to importService
            authorKeys:
                result.book.author_keys,

            subjects:
                result.book.subjects
        }
    };
};
