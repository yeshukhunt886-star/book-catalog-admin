import pool from "../config/db.js";

export const getBooks = async ({
    page = 1,
    limit = 20,
    search = "",
    subject = "",
    author = "",
    language = "",
    minYear = null,
    maxYear = null,
    quality = "",
    sort = "recently_imported",
    order = "desc"
}) => {

    // =====================================================
    // PAGINATION
    // =====================================================

    page = Number(page);
    limit = Number(limit);

    if (!Number.isInteger(page) || page < 1) {
        page = 1;
    }

    if (!Number.isInteger(limit) || limit < 1) {
        limit = 20;
    }

    if (limit > 100) {
        limit = 100;
    }

    // =====================================================
    // NORMALIZE FILTERS
    // =====================================================

    search =
        typeof search === "string"
            ? search.trim()
            : "";

    subject =
        typeof subject === "string"
            ? subject.trim()
            : "";

    author =
        typeof author === "string"
            ? author.trim()
            : "";

    language =
        typeof language === "string"
            ? language.trim()
            : "";

    minYear =
        minYear !== null &&
        minYear !== undefined &&
        minYear !== ""
            ? Number(minYear)
            : null;

    maxYear =
        maxYear !== null &&
        maxYear !== undefined &&
        maxYear !== ""
            ? Number(maxYear)
            : null;

    quality =
        typeof quality === "string"
            ? quality.trim().toLowerCase()
            : "";

    // =====================================================
    // SORTING
    // =====================================================

    const allowedSorts = {
        title: "b.title",
        publish_year: "b.first_publish_year",
        recently_imported: "b.created_at",
        recently_updated: "b.updated_at"
    };

    const sortColumn =
        allowedSorts[sort] ||
        allowedSorts.recently_imported;

    const sortOrder =
        String(order).toLowerCase() === "asc"
            ? "ASC"
            : "DESC";

    // =====================================================
    // WHERE
    // =====================================================

    const where = [];
    const params = [];

    // =====================================================
    // SEARCH
    // title + ISBN
    // =====================================================

    if (search) {

        where.push(`
            (
                b.title LIKE ?
                OR b.subtitle LIKE ?
                OR b.isbn10 LIKE ?
                OR b.isbn13 LIKE ?
            )
        `);

        const searchValue = `%${search}%`;

        params.push(
            searchValue,
            searchValue,
            searchValue,
            searchValue
        );
    }

    // =====================================================
    // SUBJECT FILTER
    // =====================================================

    if (subject) {

        where.push(`
            EXISTS (
                SELECT 1
                FROM book_subjects bs
                INNER JOIN subjects s
                    ON s.id = bs.subject_id
                WHERE bs.book_id = b.id
                AND s.name LIKE ?
            )
        `);

        params.push(`%${subject}%`);
    }

    // =====================================================
    // AUTHOR FILTER
    // =====================================================

    if (author) {

        where.push(`
            EXISTS (
                SELECT 1
                FROM book_authors ba
                INNER JOIN authors a
                    ON a.id = ba.author_id
                WHERE ba.book_id = b.id
                AND a.name LIKE ?
            )
        `);

        params.push(`%${author}%`);
    }

    // =====================================================
    // LANGUAGE FILTER
    // =====================================================

    if (language) {

        where.push(`
            b.language = ?
        `);

        params.push(language);
    }

    // =====================================================
    // MINIMUM YEAR
    // =====================================================

    if (
        minYear !== null &&
        Number.isInteger(minYear)
    ) {

        where.push(`
            b.first_publish_year >= ?
        `);

        params.push(minYear);
    }

    // =====================================================
    // MAXIMUM YEAR
    // =====================================================

    if (
        maxYear !== null &&
        Number.isInteger(maxYear)
    ) {

        where.push(`
            b.first_publish_year <= ?
        `);

        params.push(maxYear);
    }

    // =====================================================
    // DATA QUALITY
    // =====================================================

    if (quality) {

        if (quality === "high") {

            where.push(`
                b.data_quality_score >= 80
            `);

        } else if (quality === "medium") {

            where.push(`
                b.data_quality_score >= 50
                AND b.data_quality_score < 80
            `);

        } else if (quality === "low") {

            where.push(`
                b.data_quality_score < 50
            `);
        }
    }

    // =====================================================
    // WHERE CLAUSE
    // =====================================================

    const whereSQL =
        where.length > 0
            ? `WHERE ${where.join(" AND ")}`
            : "";

    // =====================================================
    // TOTAL COUNT
    // =====================================================

    const [countRows] =
        await pool.execute(
            `
            SELECT COUNT(DISTINCT b.id) AS total
            FROM books b
            ${whereSQL}
            `,
            params
        );

    const total =
        Number(countRows[0]?.total || 0);

    // =====================================================
    // TOTAL PAGES
    // =====================================================

    const totalPages =
        total === 0
            ? 0
            : Math.ceil(total / limit);

    if (
        totalPages > 0 &&
        page > totalPages
    ) {
        page = totalPages;
    }

    const offset =
        (page - 1) * limit;

    // =====================================================
    // GET BOOKS
    // =====================================================

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

            ${whereSQL}

            ORDER BY ${sortColumn} ${sortOrder}

            LIMIT ${limit}
            OFFSET ${offset}
            `,
            params
        );

    // =====================================================
    // PAGINATION
    // =====================================================

    const hasNextPage =
        page < totalPages;

    const hasPreviousPage =
        page > 1;

    // =====================================================
    // RETURN
    // =====================================================

    return {

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
            search: search || null,
            subject: subject || null,
            author: author || null,
            language: language || null,
            minYear,
            maxYear,
            quality: quality || null
        },

        sorting: {
            sort:
                allowedSorts[sort]
                    ? sort
                    : "recently_imported",

            order: sortOrder.toLowerCase()
        }
    };
};