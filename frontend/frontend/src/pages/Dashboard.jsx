import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";

function Dashboard() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/reports/summary");

            if (response.data?.success) {
                setReport(response.data.data);
            } else {
                setError(
                    response.data?.message ||
                    "Failed to load dashboard"
                );
            }
        } catch (err) {
            console.error("DASHBOARD ERROR:", err);

            setError(
                err?.response?.data?.message ||
                "Failed to load dashboard"
            );
        } finally {
            setLoading(false);
        }
    };


    // =====================================================
    // HELPERS
    // =====================================================

    const getNumber = (value) => {
        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
    };


    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "-";
        }

        return parsedDate.toLocaleString();
    };


    const getStatusClass = (status) => {
        if (!status) {
            return "";
        }

        return String(status)
            .toLowerCase()
            .replace(/\s+/g, "-");
    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="dashboard-page">

                <div className="dashboard-loading">
                    Loading dashboard...
                </div>

            </div>
        );
    }


    // =====================================================
    // DATA
    // =====================================================

    const totalBooks =
        getNumber(report?.totalBooks);

    const totalAuthors =
        getNumber(report?.totalAuthors);

    const totalSubjects =
        getNumber(report?.totalSubjects);

    const totalImports =
        getNumber(report?.totalImports);


    const importSummary =
        report?.importSummary || {};


    const recentImports =
        Array.isArray(report?.recentImports)
            ? report.recentImports
            : [];


    const importJobStatus =
        Array.isArray(report?.importJobStatus)
            ? report.importJobStatus
            : [];


    const booksBySubject =
        Array.isArray(report?.booksBySubject)
            ? report.booksBySubject
            : [];


    const booksByPublishYear =
        Array.isArray(report?.booksByPublishYear)
            ? report.booksByPublishYear
            : [];


    const topAuthors =
        Array.isArray(report?.topAuthors)
            ? report.topAuthors
            : [];


    return (
        <div className="dashboard-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="dashboard-header">

                <div>
                    <h1>
                        Dashboard
                    </h1>

                    <p>
                        Book Catalog Admin Portal overview
                    </p>
                </div>


                <button
                    type="button"
                    className="refresh-btn"
                    onClick={loadDashboard}
                >
                    ↻ Refresh
                </button>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="dashboard-error">
                    {error}
                </div>
            )}


            {/* =================================================
                MAIN STATISTICS
            ================================================= */}

            <section className="dashboard-section">

                <div className="section-header">

                    <h2>
                        Catalog Overview
                    </h2>

                    <p>
                        Overall book catalog statistics
                    </p>

                </div>


                <div className="overview-grid">

                    <div className="overview-card">

                        <span>
                            Total Books
                        </span>

                        <strong>
                            {totalBooks}
                        </strong>

                        <Link to="/books">
                            View Books
                        </Link>

                    </div>


                    <div className="overview-card">

                        <span>
                            Total Authors
                        </span>

                        <strong>
                            {totalAuthors}
                        </strong>

                        <Link to="/authors">
                            View Authors
                        </Link>

                    </div>


                    <div className="overview-card">

                        <span>
                            Total Subjects
                        </span>

                        <strong>
                            {totalSubjects}
                        </strong>

                        <Link to="/subjects">
                            View Subjects
                        </Link>

                    </div>


                    <div className="overview-card">

                        <span>
                            Total Import Jobs
                        </span>

                        <strong>
                            {totalImports}
                        </strong>

                        <Link to="/import-jobs">
                            View Imports
                        </Link>

                    </div>

                </div>

            </section>


            {/* =================================================
                IMPORT SUMMARY
            ================================================= */}

            <section className="dashboard-section">

                <div className="section-header">

                    <h2>
                        Import Overview
                    </h2>

                    <p>
                        Overall import activity
                    </p>

                </div>


                <div className="overview-grid">

                    <div className="overview-card">

                        <span>
                            Requested Books
                        </span>

                        <strong>
                            {getNumber(
                                importSummary.requestedBooks
                            )}
                        </strong>

                    </div>


                    <div className="overview-card">

                        <span>
                            Imported Books
                        </span>

                        <strong>
                            {getNumber(
                                importSummary.importedBooks
                            )}
                        </strong>

                    </div>


                    <div className="overview-card">

                        <span>
                            Updated Books
                        </span>

                        <strong>
                            {getNumber(
                                importSummary.updatedBooks
                            )}
                        </strong>

                    </div>


                    <div className="overview-card">

                        <span>
                            Skipped Books
                        </span>

                        <strong>
                            {getNumber(
                                importSummary.skippedBooks
                            )}
                        </strong>

                    </div>


                    <div className="overview-card">

                        <span>
                            Failed Books
                        </span>

                        <strong>
                            {getNumber(
                                importSummary.failedBooks
                            )}
                        </strong>

                    </div>

                </div>

            </section>


            {/* =================================================
                IMPORT STATUS
            ================================================= */}

            <section className="dashboard-section">

                <div className="section-header">

                    <h2>
                        Import Job Status
                    </h2>

                    <p>
                        Import jobs grouped by status
                    </p>

                </div>


                {importJobStatus.length === 0 ? (

                    <div className="dashboard-empty">
                        No import status data found.
                    </div>

                ) : (

                    <div className="status-grid">

                        {importJobStatus.map((item) => (

                            <div
                                className="status-card"
                                key={item.status}
                            >

                                <span>
                                    {item.status || "Unknown"}
                                </span>

                                <strong>
                                    {getNumber(
                                        item.jobCount
                                    )}
                                </strong>

                            </div>

                        ))}

                    </div>

                )}

            </section>


            {/* =================================================
                BOOKS BY SUBJECT
            ================================================= */}

            <section className="dashboard-section">

                <div className="section-header">

                    <h2>
                        Books by Subject
                    </h2>

                    <p>
                        Top subjects by number of books
                    </p>

                </div>


                {booksBySubject.length === 0 ? (

                    <div className="dashboard-empty">
                        No subject data found.
                    </div>

                ) : (

                    <div className="dashboard-table-wrapper">

                        <table className="dashboard-table">

                            <thead>

                                <tr>
                                    <th>
                                        Subject
                                    </th>

                                    <th>
                                        Books
                                    </th>
                                </tr>

                            </thead>

                            <tbody>

                                {booksBySubject
                                    .slice(0, 10)
                                    .map((item) => (

                                        <tr key={item.id}>

                                            <td>
                                                {item.name || "-"}
                                            </td>

                                            <td>
                                                {getNumber(
                                                    item.bookCount
                                                )}
                                            </td>

                                        </tr>

                                    ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>


            {/* =================================================
                TOP AUTHORS
            ================================================= */}

            <section className="dashboard-section">

                <div className="section-header">

                    <h2>
                        Top Authors
                    </h2>

                    <p>
                        Authors with the most books
                    </p>

                </div>


                {topAuthors.length === 0 ? (

                    <div className="dashboard-empty">
                        No author data found.
                    </div>

                ) : (

                    <div className="dashboard-table-wrapper">

                        <table className="dashboard-table">

                            <thead>

                                <tr>

                                    <th>
                                        Author
                                    </th>

                                    <th>
                                        Books
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {topAuthors
                                    .slice(0, 10)
                                    .map((author) => (

                                        <tr key={author.id}>

                                            <td>
                                                {author.name || "-"}
                                            </td>

                                            <td>
                                                {getNumber(
                                                    author.bookCount
                                                )}
                                            </td>

                                        </tr>

                                    ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>


            {/* =================================================
                PUBLISH YEAR
            ================================================= */}

            <section className="dashboard-section">

                <div className="section-header">

                    <h2>
                        Books by Publish Year
                    </h2>

                    <p>
                        Books grouped by publish year
                    </p>

                </div>


                {booksByPublishYear.length === 0 ? (

                    <div className="dashboard-empty">
                        No publish year data found.
                    </div>

                ) : (

                    <div className="dashboard-table-wrapper">

                        <table className="dashboard-table">

                            <thead>

                                <tr>

                                    <th>
                                        Year
                                    </th>

                                    <th>
                                        Books
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {booksByPublishYear
                                    .slice(-10)
                                    .reverse()
                                    .map((item) => (

                                        <tr
                                            key={item.publishYear}
                                        >

                                            <td>
                                                {item.publishYear}
                                            </td>

                                            <td>
                                                {getNumber(
                                                    item.bookCount
                                                )}
                                            </td>

                                        </tr>

                                    ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>


            {/* =================================================
                RECENT IMPORTS
            ================================================= */}

            <section className="dashboard-section">

                <div className="section-header">

                    <h2>
                        Recent Import Jobs
                    </h2>

                    <p>
                        Latest import activity
                    </p>

                </div>


                {recentImports.length === 0 ? (

                    <div className="dashboard-empty">
                        No recent import jobs found.
                    </div>

                ) : (

                    <div className="dashboard-table-wrapper">

                        <table className="dashboard-table">

                            <thead>

                                <tr>

                                    <th>
                                        Job ID
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Requested
                                    </th>

                                    <th>
                                        Processed
                                    </th>

                                    <th>
                                        Imported
                                    </th>

                                    <th>
                                        Failed
                                    </th>

                                    <th>
                                        Created
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {recentImports
                                    .slice(0, 10)
                                    .map((job) => (

                                        <tr key={job.id}>

                                            <td>
                                                #{job.id}
                                            </td>

                                            <td>

                                                <span
                                                    className={`dashboard-status ${getStatusClass(
                                                        job.status
                                                    )}`}
                                                >
                                                    {job.status || "-"}
                                                </span>

                                            </td>

                                            <td>
                                                {getNumber(
                                                    job.requestedCount
                                                )}
                                            </td>

                                            <td>
                                                {getNumber(
                                                    job.processedCount
                                                )}
                                            </td>

                                            <td>
                                                {getNumber(
                                                    job.importedCount
                                                )}
                                            </td>

                                            <td>
                                                {getNumber(
                                                    job.failedCount
                                                )}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    job.createdAt
                                                )}
                                            </td>

                                        </tr>

                                    ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>


            {/* =================================================
                REPORTS LINK
            ================================================= */}

            <section className="dashboard-section">

                <div className="dashboard-report-link">

                    <div>

                        <h2>
                            Detailed Reports
                        </h2>

                        <p>
                            View books, subjects, authors,
                            import history and CSV exports.
                        </p>

                    </div>

                    <Link
                        to="/reports"
                        className="reports-btn"
                    >
                        Open Reports
                    </Link>

                </div>

            </section>

        </div>
    );
}

export default Dashboard;