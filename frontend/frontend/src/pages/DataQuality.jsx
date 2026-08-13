import { useEffect, useState } from "react";
import api from "../services/api";
import "./DataQuality.css";

function DataQuality() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/books/data-quality");

            if (response.data?.success) {
                setData(response.data.data);
            } else {
                setError("Failed to load data quality dashboard");
            }
        } catch (err) {
            console.error("DATA QUALITY ERROR:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load data quality dashboard"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const markAsReviewed = async (bookId) => {
        try {
            await api.patch(`/books/${bookId}/review`);

            await fetchDashboard();

            alert("Book marked as reviewed successfully");
        } catch (err) {
            console.error("MARK REVIEWED ERROR:", err);

            alert(
                err.response?.data?.message ||
                "Failed to mark book as reviewed"
            );
        }
    };

    if (loading) {
        return (
            <div className="data-quality-page">
                <div className="loading">
                    Loading data quality dashboard...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="data-quality-page">
                <div className="error-message">
                    {error}
                </div>

                <button
                    onClick={fetchDashboard}
                    className="retry-btn"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const {
        summary = {},
        missingData = {},
        duplicateISBN = {},
        review = {}
    } = data;

    return (
        <div className="data-quality-page">

            {/* HEADER */}

            <div className="page-header">
                <div>
                    <h1>Data Quality Dashboard</h1>

                    <p>
                        Monitor book data quality and review incomplete records.
                    </p>
                </div>

                <button
                    onClick={fetchDashboard}
                    className="refresh-btn"
                >
                    Refresh
                </button>
            </div>


            {/* SUMMARY */}

            <section className="dashboard-section">

                <h2>Quality Summary</h2>

                <div className="quality-cards">

                    <div className="quality-card">
                        <span>Total Books</span>
                        <strong>
                            {summary.totalBooks ?? 0}
                        </strong>
                    </div>

                    <div className="quality-card">
                        <span>Average Quality</span>
                        <strong>
                            {summary.averageQualityScore ?? 0}
                        </strong>
                    </div>

                    <div className="quality-card high">
                        <span>High Quality</span>
                        <strong>
                            {summary.highQualityBooks ?? 0}
                        </strong>
                    </div>

                    <div className="quality-card medium">
                        <span>Medium Quality</span>
                        <strong>
                            {summary.mediumQualityBooks ?? 0}
                        </strong>
                    </div>

                    <div className="quality-card low">
                        <span>Low Quality</span>
                        <strong>
                            {summary.lowQualityBooks ?? 0}
                        </strong>
                    </div>

                </div>

            </section>


            {/* MISSING DATA */}

            <section className="dashboard-section">

                <h2>Missing Data</h2>

                <div className="missing-grid">

                    <div className="missing-card">
                        <span>Missing Authors</span>
                        <strong>
                            {missingData.author ?? 0}
                        </strong>
                    </div>

                    <div className="missing-card">
                        <span>Missing Publish Year</span>
                        <strong>
                            {missingData.publishYear ?? 0}
                        </strong>
                    </div>

                    <div className="missing-card">
                        <span>Missing Subjects</span>
                        <strong>
                            {missingData.subjects ?? 0}
                        </strong>
                    </div>

                    <div className="missing-card">
                        <span>Missing ISBN</span>
                        <strong>
                            {missingData.isbn ?? 0}
                        </strong>
                    </div>

                    <div className="missing-card">
                        <span>Missing Publisher</span>
                        <strong>
                            {missingData.publisher ?? 0}
                        </strong>
                    </div>

                    <div className="missing-card">
                        <span>Missing Language</span>
                        <strong>
                            {missingData.language ?? 0}
                        </strong>
                    </div>

                    <div className="missing-card">
                        <span>Missing Page Count</span>
                        <strong>
                            {missingData.pageCount ?? 0}
                        </strong>
                    </div>

                    <div className="missing-card">
                        <span>Missing Cover</span>
                        <strong>
                            {missingData.cover ?? 0}
                        </strong>
                    </div>

                </div>

            </section>


            {/* DUPLICATE ISBN */}

            <section className="dashboard-section">

                <h2>Possible Duplicate ISBN Records</h2>

                <div className="duplicate-summary">

                    <div>
                        <span>ISBN-10 Groups</span>
                        <strong>
                            {duplicateISBN.isbn10?.length ?? 0}
                        </strong>
                    </div>

                    <div>
                        <span>ISBN-13 Groups</span>
                        <strong>
                            {duplicateISBN.isbn13?.length ?? 0}
                        </strong>
                    </div>

                    <div>
                        <span>Total Groups</span>
                        <strong>
                            {duplicateISBN.totalGroups ?? 0}
                        </strong>
                    </div>

                </div>


                {/* ISBN 10 */}

                {duplicateISBN.isbn10?.length > 0 && (
                    <div className="duplicate-table">

                        <h3>Duplicate ISBN-10</h3>

                        <table>

                            <thead>
                                <tr>
                                    <th>ISBN-10</th>
                                    <th>Records</th>
                                </tr>
                            </thead>

                            <tbody>

                                {duplicateISBN.isbn10.map(
                                    (item, index) => (
                                        <tr key={index}>
                                            <td>
                                                {item.isbn10}
                                            </td>

                                            <td>
                                                {item.count}
                                            </td>
                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}


                {/* ISBN 13 */}

                {duplicateISBN.isbn13?.length > 0 && (
                    <div className="duplicate-table">

                        <h3>Duplicate ISBN-13</h3>

                        <table>

                            <thead>
                                <tr>
                                    <th>ISBN-13</th>
                                    <th>Records</th>
                                </tr>
                            </thead>

                            <tbody>

                                {duplicateISBN.isbn13.map(
                                    (item, index) => (
                                        <tr key={index}>
                                            <td>
                                                {item.isbn13}
                                            </td>

                                            <td>
                                                {item.count}
                                            </td>
                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

                {duplicateISBN.totalGroups === 0 && (
                    <div className="no-duplicates">
                        No possible duplicate ISBN records found.
                    </div>
                )}

            </section>


            {/* REVIEW */}

            <section className="dashboard-section">

                <h2>Review Status</h2>

                <div className="review-cards">

                    <div>
                        <span>Total Books</span>
                        <strong>
                            {review.totalBooks ?? 0}
                        </strong>
                    </div>

                    <div>
                        <span>Reviewed</span>
                        <strong>
                            {review.reviewedBooks ?? 0}
                        </strong>
                    </div>

                    <div>
                        <span>Pending Review</span>
                        <strong>
                            {review.pendingReviewBooks ?? 0}
                        </strong>
                    </div>

                </div>

                <p className="review-note">
                    Books can be marked as reviewed from the Book Details page.
                </p>

            </section>

        </div>
    );
}

export default DataQuality;