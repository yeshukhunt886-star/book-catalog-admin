import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const OPEN_LIBRARY_BASE_URL =
    process.env.OPEN_LIBRARY_BASE_URL ||
    "https://openlibrary.org";

const openLibraryApi = axios.create({
    baseURL: OPEN_LIBRARY_BASE_URL,
    timeout: 15000,

    headers: {
        Accept: "application/json",

        "User-Agent":
            process.env.OPEN_LIBRARY_USER_AGENT ||
            "BookCatalogAdminPortal/1.0"
    }
});

/*
=====================================================
HANDLE OPEN LIBRARY ERROR
=====================================================
*/

const handleOpenLibraryError = (error) => {
    if (error.response) {
        const status = error.response.status;

        const message =
            error.response.data?.message ||
            `Open Library API returned status ${status}`;

        const apiError = new Error(message);

        apiError.statusCode = status;
        apiError.isOpenLibraryError = true;

        return apiError;
    }

    if (error.code === "ECONNABORTED") {
        const timeoutError = new Error(
            "Open Library API request timed out"
        );

        timeoutError.statusCode = 504;
        timeoutError.isOpenLibraryError = true;

        return timeoutError;
    }

    if (
        error.code === "ENOTFOUND" ||
        error.code === "ECONNREFUSED"
    ) {
        const connectionError = new Error(
            "Unable to connect to Open Library API"
        );

        connectionError.statusCode = 503;
        connectionError.isOpenLibraryError = true;

        return connectionError;
    }

    return error;
};


/*
=====================================================
SEARCH BOOKS
=====================================================
*/

export const searchBooks = async ({
    query,
    page = 1,
    limit = 100
}) => {
    try {
        if (!query || !query.trim()) {
            throw new Error(
                "Search query is required"
            );
        }

        const response =
            await openLibraryApi.get(
                "/search.json",
                {
                    params: {
                        q: query.trim(),
                        page,
                        limit
                    }
                }
            );

        return {
            success: true,

            numFound:
                response.data.numFound || 0,

            start:
                response.data.start || 0,

            docs:
                response.data.docs || []
        };
    } catch (error) {
        throw handleOpenLibraryError(error);
    }
};


/*
=====================================================
GET BOOK BY OPEN LIBRARY KEY
=====================================================
*/

export const getBookByKey = async (
    workKey
) => {
    try {
        if (!workKey) {
            throw new Error(
                "Open Library work key is required"
            );
        }

        let normalizedKey =
            workKey.trim();

        if (
            !normalizedKey.startsWith(
                "/works/"
            )
        ) {
            normalizedKey =
                `/works/${normalizedKey}`;
        }

        const response =
            await openLibraryApi.get(
                `${normalizedKey}.json`
            );

        return response.data;
    } catch (error) {
        throw handleOpenLibraryError(error);
    }
};


/*
=====================================================
GET AUTHOR BY KEY
=====================================================
*/

export const getAuthorByKey = async (
    authorKey
) => {
    try {
        if (!authorKey) {
            throw new Error(
                "Open Library author key is required"
            );
        }

        let normalizedKey =
            authorKey.trim();

        if (
            !normalizedKey.startsWith(
                "/authors/"
            )
        ) {
            normalizedKey =
                `/authors/${normalizedKey}`;
        }

        const response =
            await openLibraryApi.get(
                `${normalizedKey}.json`
            );

        return response.data;
    } catch (error) {
        throw handleOpenLibraryError(error);
    }
};


/*
=====================================================
GET MULTIPLE BOOKS
=====================================================
*/

export const getBooksFromSearch = async ({
    query,
    limit = 100
}) => {
    try {
        const result =
            await searchBooks({
                query,
                page: 1,
                limit
            });

        return result.docs.slice(
            0,
            limit
        );
    } catch (error) {
        throw error;
    }
};


/*
=====================================================
EXPORT API CLIENT
=====================================================
*/

export default openLibraryApi;