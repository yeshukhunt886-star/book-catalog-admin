import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./ImportJobDetails.css";

function ImportJobDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchImportJob();
    }, [id]);

    const fetchImportJob = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                `/import/jobs/${id}`
            );

            if (response.data?.success) {
                setJob(response.data.data);
            } else {
                setError(
                    response.data?.message ||
                    "Failed to load import job"
                );
            }
        } catch (err) {
            console.error(
                "IMPORT JOB DETAILS ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load import job"
            );
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="import-job-details-page">
                <div className="import-job-loading">
                    Loading import job...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="import-job-details-page">
                <div className="import-job-error">
                    {error}
                </div>

                <button
                    className="back-button"
                    onClick={() => navigate("/dashboard")}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="import-job-details-page">
                <div className="import-job-error">
                    Import job not found.
                </div>

                <button
                    className="back-button"
                    onClick={() => navigate("/dashboard")}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="import-job-details-page">

            <div className="page-header">
                <div>
                    <h1>Import Job #{job.id}</h1>

                    <p>
                        Import job details and processing summary
                    </p>
                </div>

                <button
                    className="back-button"
                    onClick={() => navigate("/dashboard")}
                >
                    ← Dashboard
                </button>
            </div>


            <div className="job-status">
                <span>Status</span>

                <strong className={`status-${job.status}`}>
                    {job.status}
                </strong>
            </div>


            <div className="job-summary-grid">

                <div className="job-card">
                    <span>Requested</span>
                    <strong>
                        {job.requested_count}
                    </strong>
                </div>

                <div className="job-card">
                    <span>Processed</span>
                    <strong>
                        {job.processed_count}
                    </strong>
                </div>

                <div className="job-card">
                    <span>Imported</span>
                    <strong>
                        {job.imported_count}
                    </strong>
                </div>

                <div className="job-card">
                    <span>Updated</span>
                    <strong>
                        {job.updated_count}
                    </strong>
                </div>

                <div className="job-card">
                    <span>Skipped</span>
                    <strong>
                        {job.skipped_count}
                    </strong>
                </div>

                <div className="job-card">
                    <span>Failed</span>
                    <strong>
                        {job.failed_count}
                    </strong>
                </div>

            </div>


            <div className="job-information">

                <h2>Job Information</h2>

                <div className="info-row">
                    <span>Job ID</span>
                    <strong>{job.id}</strong>
                </div>

                <div className="info-row">
                    <span>Admin ID</span>
                    <strong>
                        {job.admin_id ?? "N/A"}
                    </strong>
                </div>

                <div className="info-row">
                    <span>Started At</span>
                    <strong>
                        {job.started_at
                            ? new Date(
                                job.started_at
                            ).toLocaleString()
                            : "N/A"}
                    </strong>
                </div>

                <div className="info-row">
                    <span>Completed At</span>
                    <strong>
                        {job.completed_at
                            ? new Date(
                                job.completed_at
                            ).toLocaleString()
                            : "N/A"}
                    </strong>
                </div>

                <div className="info-row">
                    <span>Created At</span>
                    <strong>
                        {job.created_at
                            ? new Date(
                                job.created_at
                            ).toLocaleString()
                            : "N/A"}
                    </strong>
                </div>

            </div>


            {job.error_message && (
                <div className="job-error-box">
                    <h2>Error</h2>

                    <p>
                        {job.error_message}
                    </p>
                </div>
            )}

        </div>
    );
}

export default ImportJobDetails;