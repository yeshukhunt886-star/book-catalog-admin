import { useEffect, useState } from "react";
import api from "../services/api";
import "./Dashboard.css";

function Dashboard() {
    const [report, setReport] = useState(null);
    const [importJobs, setImportJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        setError("");

        try {
            const reportResponse = await api.get("/reports/summary");

            if (reportResponse.data?.success) {
                setReport(reportResponse.data.data);
            }

            try {
                const jobsResponse = await api.get("/import/jobs");

                if (jobsResponse.data?.success) {
                    const data = jobsResponse.data.data;

                    if (Array.isArray(data)) {
                        setImportJobs(data);
                    } else if (Array.isArray(data?.jobs)) {
                        setImportJobs(data.jobs);
                    } else if (Array.isArray(data?.importJobs)) {
                        setImportJobs(data.importJobs);
                    } else {
                        setImportJobs([]);
                    }
                }
            } catch (jobError) {
                console.error("IMPORT JOBS ERROR:", jobError);
                setImportJobs([]);
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

    const getValue = (...values) => {
        for (const value of values) {
            if (
                value !== undefined &&
                value !== null
            ) {
                return Number(value) || 0;
            }
        }

        return 0;
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

    /* =====================================================
       TOTALS
    ===================================================== */

    const totalBooks = getValue(
        report?.totalBooks,
        report?.bookSummary?.totalBooks,
        report?.books?.total
    );

    const totalAuthors = getValue(
        report?.totalAuthors,
        report?.authorSummary?.totalAuthors,
        report?.authors?.total
    );

    const totalSubjects = getValue(
        report?.totalSubjects,
        report?.subjectSummary?.totalSubjects,
        report?.subjects?.total
    );

    /* =====================================================
       IMPORT
    ===================================================== */

    const importSummary =
        report?.importSummary || {};

    const totalImports = getValue(
        importSummary.totalJobs,
        report?.totalImportJobs
    );

    const latestImport =
        importJobs.length > 0
            ? importJobs[0]
            : null;

    /* =====================================================
       RECENT ACTIVITY
    ===================================================== */

    const recentActivity =
        Array.isArray(report?.recentActivity)
            ? report.recentActivity
            : importJobs.slice(0, 5);

    if (loading) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-loading">
                    Loading dashboard...
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">

            {/* HEADER */}

            <div className="dashboard-header">

                <div>
                    <h1>Dashboard</h1>

                    <p>
                        Book Catalog Admin Portal overview
                    </p>
                </div>

                <button
                    className="refresh-btn"
                    onClick={loadDashboard}
                >
                    ↻ Refresh
                </button>

            </div>

            {error && (
                <div className="dashboard-error">
                    {error}
                </div>
            )}

            {/* =================================================
                BOOKS OVERVIEW
            ================================================= */}

            <section className="dashboard-section">

                <div className="section-header">

                    <h2>Books Overview</h2>

                    <p>
                        Overall book catalog statistics
                    </p>

                </div>

                <div className="overview-grid single">

                    <div className="overview-card">

                        <span>
                            Total Books
                        </span>

                        <strong>
                            {totalBooks}
                        </strong>

                    </div>

                </div>

            </section>

            {/* =================================================
                AUTHORS OVERVIEW
            ================================================= */}

            <section className="dashboard-section">

                <div className="section-header">

                    <h2>Authors Overview</h2>

                    <p>
                        Overall author catalog statistics
                    </p>

                </div>

                <div className="overview-grid single">

                    <div className="overview-card">

                        <span>
                            Total Authors
                        </span>

                        <strong>
                            {totalAuthors}
                        </strong>

                    </div>

                </div>

            </section>

            {/* =================================================
                SUBJECTS OVERVIEW
            ================================================= */}

            <section className="dashboard-section">

                <div className="section-header">

                    <h2>Subjects Overview</h2>

                    <p>
                        Overall subject catalog statistics
                    </p>

                </div>

                <div className="overview-grid single">

                    <div className="overview-card">

                        <span>
                            Total Subjects
                        </span>

                        <strong>
                            {totalSubjects}
                        </strong>

                    </div>

                </div>

            </section>

            {/* =================================================
                IMPORT OVERVIEW
            ================================================= */}

            <section className="dashboard-section">

                <div className="section-header">

                    <h2>Import Overview</h2>

                    <p>
                        Book import activity summary
                    </p>

                </div>

                <div className="overview-grid single">

                    <div className="overview-card">

                        <span>
                            Total Import Jobs
                        </span>

                        <strong>
                            {totalImports}
                        </strong>

                    </div>

                </div>

                {latestImport && (
                    <div className="latest-import-summary">

                        <div>
                            <span>
                                Latest Job
                            </span>

                            <strong>
                                #{latestImport.id}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Status
                            </span>

                            <strong
                                className={`status-text ${
                                    latestImport.status
                                }`}
                            >
                                {latestImport.status || "-"}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Requested
                            </span>

                            <strong>
                                {getValue(
                                    latestImport.requested_count,
                                    latestImport.requestedCount
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Processed
                            </span>

                            <strong>
                                {getValue(
                                    latestImport.processed_count,
                                    latestImport.processedCount
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Imported
                            </span>

                            <strong>
                                {getValue(
                                    latestImport.imported_count,
                                    latestImport.importedCount
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Updated
                            </span>

                            <strong>
                                {getValue(
                                    latestImport.updated_count,
                                    latestImport.updatedCount
                                )}
                            </strong>
                        </div>

                    </div>
                )}

            </section>

            {/* =================================================
                RECENT ACTIVITY
            ================================================= */}

            <section className="dashboard-section">

                <div className="section-header">

                    <h2>Recent Activity</h2>

                    <p>
                        Latest activity in the book catalog
                    </p>

                </div>

                {recentActivity.length === 0 ? (

                    <div className="dashboard-empty">
                        No recent activity found.
                    </div>

                ) : (

                    <div className="activity-list">

                        {recentActivity
                            .slice(0, 5)
                            .map((activity, index) => {

                                const activityId =
                                    activity.id ??
                                    activity.job_id ??
                                    index;

                                const activityType =
                                    activity.type ||
                                    activity.action ||
                                    "Import Job";

                                const activityStatus =
                                    activity.status ||
                                    "completed";

                                const activityDate =
                                    activity.created_at ??
                                    activity.createdAt ??
                                    activity.performed_at ??
                                    activity.performedAt;

                                return (
                                    <div
                                        className="activity-item"
                                        key={activityId}
                                    >

                                        <div className="activity-info">

                                            <strong>
                                                {activityType}
                                            </strong>

                                            <span>
                                                {activity.description ||
                                                    `Import job #${
                                                        activity.id ?? "-"
                                                    }`}
                                            </span>

                                        </div>

                                        <div className="activity-meta">

                                            <span
                                                className={`activity-status ${
                                                    activityStatus
                                                }`}
                                            >
                                                {activityStatus}
                                            </span>

                                            <small>
                                                {formatDate(
                                                    activityDate
                                                )}
                                            </small>

                                        </div>

                                    </div>
                                );
                            })}

                    </div>

                )}

            </section>

        </div>
    );
}

export default Dashboard;