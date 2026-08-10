

/*
=====================================================
CLEAN STRING
=====================================================
*/

export const cleanString = (
    value,
    maxLength = null
) => {

    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }


    if (
        typeof value !== "string"
    ) {
        return null;
    }


    let cleaned =
        value
            .replace(/\s+/g, " ")
            .trim();


    if (!cleaned) {
        return null;
    }


    if (
        maxLength &&
        cleaned.length > maxLength
    ) {

        cleaned =
            cleaned.substring(
                0,
                maxLength
            );
    }


    return cleaned;
};


/*
=====================================================
CLEAN ISBN
=====================================================
*/

export const cleanISBN = (
    value
) => {

    if (
        value === null ||
        value === undefined
    ) {

        return null;
    }


    const isbn =
        String(value)
            .replace(
                /[-\s]/g,
                ""
            )
            .trim()
            .toUpperCase();


    return isbn || null;
};


/*
=====================================================
VALIDATE ISBN-10
=====================================================
*/

export const isValidISBN10 = (
    isbn
) => {

    if (
        !isbn ||
        isbn.length !== 10
    ) {

        return false;
    }


    if (
        !/^\d{9}[\dX]$/.test(
            isbn
        )
    ) {

        return false;
    }


    let sum = 0;


    for (
        let i = 0;
        i < 10;
        i++
    ) {

        const digit =
            isbn[i] === "X"
                ? 10
                : Number(
                    isbn[i]
                );


        sum +=
            digit *
            (10 - i);
    }


    return (
        sum % 11 === 0
    );
};


/*
=====================================================
VALIDATE ISBN-13
=====================================================
*/

export const isValidISBN13 = (
    isbn
) => {

    if (
        !isbn ||
        isbn.length !== 13
    ) {

        return false;
    }


    if (
        !/^\d{13}$/.test(
            isbn
        )
    ) {

        return false;
    }


    let sum = 0;


    for (
        let i = 0;
        i < 13;
        i++
    ) {

        const digit =
            Number(
                isbn[i]
            );


        sum +=
            i % 2 === 0
                ? digit
                : digit * 3;
    }


    return (
        sum % 10 === 0
    );
};


/*
=====================================================
CLEAN YEAR
=====================================================
*/

export const cleanYear = (
    value
) => {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;
    }


    const year =
        Number(value);


    if (
        !Number.isInteger(year)
    ) {

        return null;
    }


    const currentYear =
        new Date()
            .getFullYear();


    if (
        year < 1000 ||
        year > currentYear
    ) {

        return null;
    }


    return year;
};


/*
=====================================================
CLEAN PAGE COUNT
=====================================================
*/

export const cleanPageCount = (
    value
) => {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;
    }


    const pages =
        Number(value);


    if (
        !Number.isInteger(pages)
    ) {

        return null;
    }


    if (
        pages <= 0 ||
        pages > 100000
    ) {

        return null;
    }


    return pages;
};


/*
=====================================================
CLEAN LANGUAGE
=====================================================
*/

export const cleanLanguage = (
    value
) => {

    return cleanString(
        value,
        100
    );
};


/*
=====================================================
CLEAN AUTHORS
=====================================================
*/

export const cleanAuthors = (
    authors
) => {

    if (
        !Array.isArray(authors)
    ) {

        return [];
    }


    const cleaned =
        authors
            .map(
                (author) =>
                    cleanString(
                        author,
                        255
                    )
            )
            .filter(Boolean);


    return [
        ...new Set(
            cleaned
        )
    ];
};


/*
=====================================================
CLEAN AUTHOR KEYS
=====================================================
*/

export const cleanAuthorKeys = (
    authorKeys
) => {

    if (
        !Array.isArray(
            authorKeys
        )
    ) {

        return [];
    }


    return [
        ...new Set(
            authorKeys
                .map(
                    (key) =>
                        cleanString(
                            key,
                            100
                        )
                )
                .filter(Boolean)
        )
    ];
};


/*
=====================================================
CLEAN SUBJECTS
=====================================================
*/

export const cleanSubjects = (
    subjects
) => {

    if (
        !Array.isArray(
            subjects
        )
    ) {

        return [];
    }


    const cleaned =
        subjects
            .map(
                (subject) => {

                    if (
                        typeof subject !==
                        "string"
                    ) {

                        return null;
                    }


                    return subject
                        .replace(
                            /\s+/g,
                            " "
                        )
                        .trim();
                }
            )
            .filter(Boolean);


    return [
        ...new Set(
            cleaned
        )
    ].slice(
        0,
        30
    );
};


/*
=====================================================
CLEAN BOOK
=====================================================
*/

export const cleanBook = (
    book
) => {

    if (
        !book ||
        typeof book !== "object"
    ) {

        return null;
    }


    return {

        openLibraryKey:
            cleanString(
                book.openLibraryKey,
                255
            ),

        title:
            cleanString(
                book.title,
                500
            ),

        subtitle:
            cleanString(
                book.subtitle,
                500
            ),

        isbn10:
            cleanISBN(
                book.isbn10
            ),

        isbn13:
            cleanISBN(
                book.isbn13
            ),

        publisher:
            cleanString(
                book.publisher,
                500
            ),

        publishDate:
            cleanString(
                book.publishDate,
                100
            ),

        firstPublishYear:
            cleanYear(
                book.firstPublishYear
            ),

        language:
            cleanLanguage(
                book.language
            ),

        description:
            cleanString(
                book.description,
                10000
            ),

        coverUrl:
            cleanString(
                book.coverUrl,
                1000
            ),

        pageCount:
            cleanPageCount(
                book.pageCount
            ),

        authors:
            cleanAuthors(
                book.authors
            ),

        authorKeys:
            cleanAuthorKeys(
                book.authorKeys
            ),

        subjects:
            cleanSubjects(
                book.subjects
            )
    };
};


/*
=====================================================
VALIDATE BOOK
=====================================================
*/

export const validateBook = (
    book
) => {

    const errors = [];


    if (!book.title) {

        errors.push(
            "Book title is required"
        );
    }


    if (
        book.openLibraryKey &&
        !book.openLibraryKey.startsWith(
            "/works/"
        )
    ) {

        errors.push(
            "Invalid Open Library key"
        );
    }


    if (
        book.firstPublishYear !==
        null
    ) {

        const currentYear =
            new Date()
                .getFullYear();


        if (
            book.firstPublishYear <
                1000 ||
            book.firstPublishYear >
                currentYear
        ) {

            errors.push(
                "Invalid publication year"
            );
        }
    }


    if (
        book.pageCount !== null &&
        (
            book.pageCount <= 0 ||
            book.pageCount > 100000
        )
    ) {

        errors.push(
            "Invalid page count"
        );
    }


    if (
        !Array.isArray(
            book.authors
        ) ||
        book.authors.length === 0
    ) {

        console.log(
            `WARNING: No author found for "${book.title}"`
        );
    }


    if (
        !Array.isArray(
            book.subjects
        ) ||
        book.subjects.length === 0
    ) {

        console.log(
            `INFO: No subjects found for "${book.title}"`
        );
    }


    return {

        valid:
            errors.length === 0,

        errors
    };
};


/*
=====================================================
REMOVE INVALID ISBN
=====================================================
*/

const removeInvalidISBNs = (
    book
) => {

    if (
        book.isbn10 &&
        !isValidISBN10(
            book.isbn10
        )
    ) {

        console.log(
            `WARNING: Invalid ISBN-10 for "${book.title}"`
        );

        book.isbn10 = null;
    }


    if (
        book.isbn13 &&
        !isValidISBN13(
            book.isbn13
        )
    ) {

        console.log(
            `WARNING: Invalid ISBN-13 for "${book.title}"`
        );

        book.isbn13 = null;
    }


    return book;
};


/*
=====================================================
CLEAN + VALIDATE BOOK
=====================================================
*/

export const cleanAndValidateBook = (
    rawBook
) => {

    const book =
        cleanBook(
            rawBook
        );


    if (!book) {

        return {

            valid: false,

            book: null,

            errors: [
                "Invalid book object"
            ]
        };
    }


    removeInvalidISBNs(
        book
    );


    const validation =
        validateBook(
            book
        );


    return {

        valid:
            validation.valid,

        book,

        errors:
            validation.errors
    };
};