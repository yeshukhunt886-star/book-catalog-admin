import { useEffect, useState } from "react";
import api from "../services/api";
import "./Reports.css";

function Reports() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [summary, setSummary] = useState(null);
    const [books, setBooks] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [publishYears, setPublishYears] = useState([]);
    const [authors, setAuthors] = useState([]);
    const [importHistory, setImportHistory] = useState([]);
    const [dataQuality, setDataQuality] = useState(null);

    const [filters, setFilters] = useState({
        search: "",
        author: "",
        subject: "",
        year: "",
        page: 1,
        limit: 20
    });

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
    });

    /*
    =====================================================
    LOAD ALL REPORT DATA
    =====================================================
    */

    const loadReports = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                summaryResponse,
                subjectsResponse,
                yearsResponse,
                authorsResponse,
                importsResponse,
                qualityResponse
            ] = await Promise.all([
                api.get("/reports/summary"),

                api.get("/reports/subjects"),

                api.get("/reports/publish-years"),

                api.get("/reports/authors?limit=20"),

                api.get("/reports/import-history?limit=20"),

                api.get("/reports/data-quality")
            ]);

            /*
            =============================================
            SUMMARY
            =============================================
            */

            if (summaryResponse.data?.success) {
                setSummary(summaryResponse.data.data);
            }

            /*
            =============================================
            SUBJECTS
            =============================================
            */

            if (subjectsResponse.data?.success) {
                setSubjects(
                    subjectsResponse.data.data || []
                );
            }

            /*
            =============================================
            PUBLISH YEARS
            =============================================
            */

            if (yearsResponse.data?.success) {
                setPublishYears(
                    yearsResponse.data.data || []
                );
            }

            /*
            =============================================
            AUTHORS
            =============================================
            */

            if (authorsResponse.data?.success) {
                setAuthors(
                    authorsResponse.data.data || []
                );
            }

            /*
            =============================================
            IMPORT HISTORY
            =============================================
            */

            if (importsResponse.data?.success) {
                setImportHistory(
                    importsResponse.data.data || []
                );
            }

            /*
            =============================================
            DATA QUALITY
            =============================================
            */

            if (qualityResponse.data?.success) {
                setDataQuality(
                    qualityResponse.data.data
                );
            }

            /*
            =============================================
            LOAD BOOKS
            =============================================
            */

            await loadBooks(filters);

        } catch (err) {
            console.error(
                "REPORTS LOAD ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load reports"
            );
        } finally {
            setLoading(false);
        }
    };


    /*
    =====================================================
    LOAD BOOK REPORT
    =====================================================
    */

    const loadBooks = async (currentFilters = filters) => {
        try {
            const params = new URLSearchParams();

            if (currentFilters.search.trim()) {
                params.append(
                    "search",
                    currentFilters.search.trim()
                );
            }

            if (currentFilters.author.trim()) {
                params.append(
                    "author",
                    currentFilters.author.trim()
                );
            }

            if (currentFilters.subject.trim()) {
                params.append(
                    "subject",
                    currentFilters.subject.trim()
                );
            }

            if (currentFilters.year !== "") {
                params.append(
                    "year",
                    currentFilters.year
                );
            }

            params.append(
                "page",
                currentFilters.page
            );

            params.append(
                "limit",
                currentFilters.limit
            );

            const response = await api.get(
                `/reports/books?${params.toString()}`
            );

            if (response.data?.success) {
                setBooks(
                    response.data.data?.books || []
                );

                setPagination(
                    response.data.data?.pagination || {
                        page: 1,
                        limit: 20,
                        total: 0,
                        totalPages: 0,
                        hasNextPage: false,
                        hasPreviousPage: false
                    }
                );
            }

        } catch (err) {
            console.error(
                "BOOK REPORT ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load books report"
            );
        }
    };


    /*
    =====================================================
    INITIAL LOAD
    =====================================================
    */

    useEffect(() => {
        loadReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    /*
    =====================================================
    FILTER CHANGE
    =====================================================
    */

    const handleFilterChange = (event) => {
        const {
            name,
            value
        } = event.target;

        setFilters((previous) => ({
            ...previous,
            [name]: value,
            page: 1
        }));
    };


    /*
    =====================================================
    APPLY FILTERS
    =====================================================
    */

    const handleSearch = async (event) => {
        event.preventDefault();

        const updatedFilters = {
            ...filters,
            page: 1
        };

        setFilters(updatedFilters);

        setLoading(true);

        try {
            await loadBooks(updatedFilters);
        } finally {
            setLoading(false);
        }
    };


    /*
    =====================================================
    CLEAR FILTERS
    =====================================================
    */

    const handleClearFilters = async () => {
        const clearedFilters = {
            search: "",
            author: "",
            subject: "",
            year: "",
            page: 1,
            limit: 20
        };

        setFilters(clearedFilters);

        setLoading(true);

        try {
            await loadBooks(clearedFilters);
        } finally {
            setLoading(false);
        }
    };


    /*
    =====================================================
    PAGINATION
    =====================================================
    */

    const handlePageChange = async (newPage) => {
        if (
            newPage < 1 ||
            newPage > pagination.totalPages
        ) {
            return;
        }

        const updatedFilters = {
            ...filters,
            page: newPage
        };

        setFilters(updatedFilters);

        setLoading(true);

        try {
            await loadBooks(updatedFilters);
        } finally {
            setLoading(false);
        }
    };


    /*
    =====================================================
    BOOK CSV EXPORT
    =====================================================
    */

    const handleBooksExport = async () => {
        try {
            const response = await api.get(
                "/reports/books/export",
                {
                    responseType: "blob"
                }
            );

            const blob = new Blob(
                [response.data],
                {
                    type: "text/csv;charset=utf-8;"
                }
            );

            const url =
                window.URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;
            link.download = "books.csv";

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error(
                "BOOK CSV EXPORT ERROR:",
                err
            );

            setError(
                "Failed to export books CSV"
            );
        }
    };


    /*
    =====================================================
    COMPLETE REPORT CSV EXPORT
    =====================================================
    */

    const handleReportsExport = async () => {
        try {
            const response = await api.get(
                "/reports/export",
                {
                    responseType: "blob"
                }
            );

            const blob = new Blob(
                [response.data],
                {
                    type: "text/csv;charset=utf-8;"
                }
            );

            const url =
                window.URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;
            link.download = "reports.csv";

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error(
                "REPORT CSV EXPORT ERROR:",
                err
            );

            setError(
                "Failed to export reports CSV"
            );
        }
    };


    /*
    =====================================================
    FORMAT NUMBER
    =====================================================
    */

    const formatNumber = (value) => {
        return Number(value || 0).toLocaleString();
    };


    /*
    =====================================================
    LOADING
    =====================================================
    */

    if (loading && !summary) {
        return (
            <div className="reports-page">
                <div className="reports-loading">
                    Loading reports...
                </div>
            </div>
        );
    }


    /*
    =====================================================
    RENDER
    =====================================================
    */

    return (
        <div className="reports-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="reports-header">

                <div>
                    <h1>Reports</h1>

                    <p>
                        Books, authors, subjects,
                        imports and data quality reports
                    </p>
                </div>

                <div className="reports-header-actions">

                    <button
                        type="button"
                        className="reports-export-button"
                        onClick={handleBooksExport}
                    >
                        Export Books CSV
                    </button>

                    <button
                        type="button"
                        className="reports-export-button"
                        onClick={handleReportsExport}
                    >
                        Export Reports CSV
                    </button>

                </div>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="reports-error">
                    {error}
                </div>
            )}


            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <div className="reports-summary-grid">

                <div className="report-card">
                    <h3>Total Books</h3>

                    <strong>
                        {formatNumber(
                            summary?.totalBooks
                        )}
                    </strong>
                </div>


                <div className="report-card">
                    <h3>Total Authors</h3>

                    <strong>
                        {formatNumber(
                            summary?.totalAuthors
                        )}
                    </strong>
                </div>


                <div className="report-card">
                    <h3>Total Subjects</h3>

                    <strong>
                        {formatNumber(
                            summary?.totalSubjects
                        )}
                    </strong>
                </div>


                <div className="report-card">
                    <h3>Total Imports</h3>

                    <strong>
                        {formatNumber(
                            summary?.totalImports
                        )}
                    </strong>
                </div>

            </div>


            {/* =================================================
                DATA QUALITY
            ================================================= */}

            <section className="reports-section">

                <div className="reports-section-header">

                    <div>
                        <h2>Data Quality</h2>

                        <p>
                            Current quality issues in the
                            book catalog
                        </p>
                    </div>

                </div>


                <div className="data-quality-grid">

                    <div className="quality-card">
                        <span>
                            Missing Authors
                        </span>

                        <strong>
                            {formatNumber(
                                dataQuality?.missingAuthors
                            )}
                        </strong>
                    </div>


                    <div className="quality-card">
                        <span>
                            Missing Publish Year
                        </span>

                        <strong>
                            {formatNumber(
                                dataQuality?.missingPublishYear
                            )}
                        </strong>
                    </div>


                    <div className="quality-card">
                        <span>
                            Duplicate ISBN-13
                        </span>

                        <strong>
                            {formatNumber(
                                dataQuality?.duplicateISBN13
                            )}
                        </strong>
                    </div>


                    <div className="quality-card">
                        <span>
                            Duplicate ISBN-10
                        </span>

                        <strong>
                            {formatNumber(
                                dataQuality?.duplicateISBN10
                            )}
                        </strong>
                    </div>


                    <div className="quality-card">
                        <span>
                            Weak Data
                        </span>

                        <strong>
                            {formatNumber(
                                dataQuality?.weakData
                            )}
                        </strong>
                    </div>

                </div>

            </section>


            {/* =================================================
                BOOK FILTERS
            ================================================= */}

            <section className="reports-section">

                <div className="reports-section-header">

                    <div>
                        <h2>Books Report</h2>

                        <p>
                            Search and filter books
                        </p>
                    </div>

                </div>


                <form
                    className="reports-filters"
                    onSubmit={handleSearch}
                >

                    <input
                        type="text"
                        name="search"
                        placeholder="Search by title..."
                        value={filters.search}
                        onChange={handleFilterChange}
                    />


                    <input
                        type="text"
                        name="author"
                        placeholder="Author..."
                        value={filters.author}
                        onChange={handleFilterChange}
                    />


                    <input
                        type="text"
                        name="subject"
                        placeholder="Subject..."
                        value={filters.subject}
                        onChange={handleFilterChange}
                    />


                    <input
                        type="number"
                        name="year"
                        placeholder="Publish year..."
                        value={filters.year}
                        onChange={handleFilterChange}
                        min="1"
                    />


                    <button
                        type="submit"
                        className="reports-search-button"
                    >
                        Search
                    </button>


                    <button
                        type="button"
                        className="reports-clear-button"
                        onClick={handleClearFilters}
                    >
                        Clear
                    </button>

                </form>


                {/* =================================================
                    BOOK TABLE
                ================================================= */}

                <div className="reports-table-wrapper">

                    <table className="reports-table">

                        <thead>

                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Authors</th>
                                <th>Subjects</th>
                                <th>Year</th>
                                <th>Publisher</th>
                                <th>Language</th>
                                <th>Pages</th>
                                <th>Quality</th>
                            </tr>

                        </thead>


                        <tbody>

                            {books.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="9"
                                        className="reports-empty"
                                    >
                                        No books found
                                    </td>
                                </tr>

                            ) : (

                                books.map((book) => (

                                    <tr key={book.id}>

                                        <td>
                                            {book.id}
                                        </td>

                                        <td>
                                            <strong>
                                                {book.title || "-"}
                                            </strong>
                                        </td>

                                        <td>
                                            {book.authors || "-"}
                                        </td>

                                        <td>
                                            {book.subjects || "-"}
                                        </td>

                                        <td>
                                            {book.first_publish_year || "-"}
                                        </td>

                                        <td>
                                            {book.publisher || "-"}
                                        </td>

                                        <td>
                                            {book.language || "-"}
                                        </td>

                                        <td>
                                            {book.page_count || "-"}
                                        </td>

                                        <td>
                                            {book.data_quality_score
                                                ? `${book.data_quality_score}%`
                                                : "-"}
                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>


                {/* =================================================
                    PAGINATION
                ================================================= */}

                <div className="reports-pagination">

                    <button
                        type="button"
                        disabled={
                            !pagination.hasPreviousPage
                        }
                        onClick={() =>
                            handlePageChange(
                                pagination.page - 1
                            )
                        }
                    >
                        Previous
                    </button>


                    <span>
                        Page{" "}
                        <strong>
                            {pagination.page}
                        </strong>{" "}
                        of{" "}
                        <strong>
                            {pagination.totalPages}
                        </strong>

                        {" "}(
                        {formatNumber(
                            pagination.total
                        )}{" "}
                        books)
                    </span>


                    <button
                        type="button"
                        disabled={
                            !pagination.hasNextPage
                        }
                        onClick={() =>
                            handlePageChange(
                                pagination.page + 1
                            )
                        }
                    >
                        Next
                    </button>

                </div>

            </section>


            {/* =================================================
                SUBJECT REPORT
            ================================================= */}

            <section className="reports-section">

                <div className="reports-section-header">

                    <div>
                        <h2>Books by Subject</h2>

                        <p>
                            Number of books grouped by subject
                        </p>
                    </div>

                </div>


                <div className="reports-table-wrapper">

                    <table className="reports-table">

                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Subject</th>
                                <th>Book Count</th>
                            </tr>
                        </thead>

                        <tbody>

                            {subjects.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="3"
                                        className="reports-empty"
                                    >
                                        No subject data found
                                    </td>
                                </tr>

                            ) : (

                                subjects.map((item) => (

                                    <tr key={item.id}>

                                        <td>
                                            {item.id}
                                        </td>

                                        <td>
                                            {item.name}
                                        </td>

                                        <td>
                                            {formatNumber(
                                                item.bookCount
                                            )}
                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </section>


            {/* =================================================
                PUBLISH YEAR REPORT
            ================================================= */}

            <section className="reports-section">

                <div className="reports-section-header">

                    <div>
                        <h2>Books by Publish Year</h2>

                        <p>
                            Books grouped by publish year
                        </p>
                    </div>

                </div>


                <div className="reports-table-wrapper">

                    <table className="reports-table">

                        <thead>
                            <tr>
                                <th>Publish Year</th>
                                <th>Book Count</th>
                            </tr>
                        </thead>

                        <tbody>

                            {publishYears.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="2"
                                        className="reports-empty"
                                    >
                                        No publish year data found
                                    </td>
                                </tr>

                            ) : (

                                publishYears.map((item) => (

                                    <tr
                                        key={
                                            item.publishYear
                                        }
                                    >

                                        <td>
                                            {item.publishYear}
                                        </td>

                                        <td>
                                            {formatNumber(
                                                item.bookCount
                                            )}
                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </section>


            {/* =================================================
                AUTHORS REPORT
            ================================================= */}

            <section className="reports-section">

                <div className="reports-section-header">

                    <div>
                        <h2>Top Authors</h2>

                        <p>
                            Authors with the highest number
                            of books
                        </p>
                    </div>

                </div>


                <div className="reports-table-wrapper">

                    <table className="reports-table">

                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Author</th>
                                <th>Book Count</th>
                            </tr>
                        </thead>

                        <tbody>

                            {authors.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="3"
                                        className="reports-empty"
                                    >
                                        No author data found
                                    </td>
                                </tr>

                            ) : (

                                authors.map((author) => (

                                    <tr key={author.id}>

                                        <td>
                                            {author.id}
                                        </td>

                                        <td>
                                            {author.name}
                                        </td>

                                        <td>
                                            {formatNumber(
                                                author.bookCount
                                            )}
                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </section>


            {/* =================================================
                IMPORT SUMMARY
            ================================================= */}

            <section className="reports-section">

                <div className="reports-section-header">

                    <div>
                        <h2>Import Summary</h2>

                        <p>
                            Overall import statistics
                        </p>
                    </div>

                </div>


                <div className="import-summary-grid">

                    <div className="quality-card">
                        <span>Total Jobs</span>
                        <strong>
                            {formatNumber(
                                summary?.importSummary?.totalJobs
                            )}
                        </strong>
                    </div>

                    <div className="quality-card">
                        <span>Requested Books</span>
                        <strong>
                            {formatNumber(
                                summary?.importSummary?.requestedBooks
                            )}
                        </strong>
                    </div>

                    <div className="quality-card">
                        <span>Imported Books</span>
                        <strong>
                            {formatNumber(
                                summary?.importSummary?.importedBooks
                            )}
                        </strong>
                    </div>

                    <div className="quality-card">
                        <span>Updated Books</span>
                        <strong>
                            {formatNumber(
                                summary?.importSummary?.updatedBooks
                            )}
                        </strong>
                    </div>

                    <div className="quality-card">
                        <span>Skipped Books</span>
                        <strong>
                            {formatNumber(
                                summary?.importSummary?.skippedBooks
                            )}
                        </strong>
                    </div>

                    <div className="quality-card">
                        <span>Failed Books</span>
                        <strong>
                            {formatNumber(
                                summary?.importSummary?.failedBooks
                            )}
                        </strong>
                    </div>

                </div>

            </section>


            {/* =================================================
                IMPORT HISTORY
            ================================================= */}

            <section className="reports-section">

                <div className="reports-section-header">

                    <div>
                        <h2>Import History</h2>

                        <p>
                            Recent import jobs
                        </p>
                    </div>

                </div>


                <div className="reports-table-wrapper">

                    <table className="reports-table">

                        <thead>

                            <tr>
                                <th>ID</th>
                                <th>Admin ID</th>
                                <th>Requested</th>
                                <th>Processed</th>
                                <th>Imported</th>
                                <th>Updated</th>
                                <th>Skipped</th>
                                <th>Failed</th>
                                <th>Status</th>
                                <th>Created</th>
                            </tr>

                        </thead>


                        <tbody>

                            {importHistory.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="10"
                                        className="reports-empty"
                                    >
                                        No import history found
                                    </td>
                                </tr>

                            ) : (

                                importHistory.map((job) => (

                                    <tr key={job.id}>

                                        <td>
                                            {job.id}
                                        </td>

                                        <td>
                                            {job.adminId ?? "-"}
                                        </td>

                                        <td>
                                            {formatNumber(
                                                job.requestedCount
                                            )}
                                        </td>

                                        <td>
                                            {formatNumber(
                                                job.processedCount
                                            )}
                                        </td>

                                        <td>
                                            {formatNumber(
                                                job.importedCount
                                            )}
                                        </td>

                                        <td>
                                            {formatNumber(
                                                job.updatedCount
                                            )}
                                        </td>

                                        <td>
                                            {formatNumber(
                                                job.skippedCount
                                            )}
                                        </td>

                                        <td>
                                            {formatNumber(
                                                job.failedCount
                                            )}
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    `import-status status-${String(
                                                        job.status || ""
                                                    ).toLowerCase()}`
                                                }
                                            >
                                                {job.status || "-"}
                                            </span>
                                        </td>

                                        <td>
                                            {job.createdAt
                                                ? new Date(
                                                    job.createdAt
                                                ).toLocaleString()
                                                : "-"}
                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </section>

        </div>
    );
}

export default Reports;