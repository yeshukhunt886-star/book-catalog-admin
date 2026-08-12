
import pool from "../config/db.js";


export const getBooks = async ({
    page = 1,
    limit = 20
}) => {

    // CONVERT VALUES TO NUMBERS
    page = Number(page);
    limit = Number(limit);


    // VALIDATE PAGE
    if (
        !Number.isInteger(page) ||
        page < 1
    ) {
        page = 1;
    }

    // VALIDATE LIMIT
    if (
        !Number.isInteger(limit) ||
        limit < 1
    ) {
        limit = 20;
    }

    // MAXIMUM LIMIT
    if (limit > 100) {
        limit = 100;
    }


    // GET TOTAL BOOKS
    const [countRows] =
        await pool.execute(
            `
            SELECT COUNT(*) AS total
            FROM books
            `
        );


    const total =
        Number(
            countRows[0]?.total || 0
        );


    // CALCULATE PAGINATION
    const totalPages =
        total === 0
            ? 0
            : Math.ceil(
                total / limit
            );


    // IF PAGE IS GREATER THAN TOTAL PAGES
    if (
        totalPages > 0 &&
        page > totalPages
    ) {

        page = totalPages;

    }

    // CALCULATE OFFSET
    const offset =
        (page - 1) * limit;


    // GET PAGINATED BOOKS
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
                publish_date,
                first_publish_year,
                language,
                cover_url,
                page_count,
                data_source,
                data_quality_score,
                created_at,
                updated_at

            FROM books

            ORDER BY id DESC

            LIMIT ${limit}
            OFFSET ${offset}
            `
        );


    // PAGINATION INFORMATION
    const hasNextPage =
        page < totalPages;

    const hasPreviousPage =
        page > 1;


    // RETURN RESULT
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

        }

    };
};
