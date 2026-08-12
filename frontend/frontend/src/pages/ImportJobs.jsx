import { useEffect, useState } from "react";
import api from "../services/api";
import "./ImportJobs.css";

function ImportJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const fetchImportJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/import/jobs");

      console.log("IMPORT JOBS RESPONSE:", response.data);

      if (response.data?.success) {
        setJobs(response.data.data || []);
      } else {
        setJobs([]);
        setError(response.data?.message || "Failed to load import jobs");
      }
    } catch (err) {
      console.error("IMPORT JOBS ERROR:", err);

      setJobs([]);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load import jobs"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImportJobs();
  }, []);

  const totalPages = Math.ceil(jobs.length / limit);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const currentJobs = jobs.slice(startIndex, endIndex);

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString();
  };

  const getStatusClass = (status) => {
    if (status === "completed") {
      return "status-completed";
    }

    if (status === "failed") {
      return "status-failed";
    }

    if (status === "running") {
      return "status-running";
    }

    if (status === "cancelled") {
      return "status-cancelled";
    }

    return "status-default";
  };

  return (
    <div className="import-jobs-page">
      <div className="import-jobs-header">
        <div>
          <h1>Import Jobs</h1>
          <p>View and monitor book import jobs</p>
        </div>

        <button
          className="refresh-button"
          onClick={fetchImportJobs}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="import-jobs-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="import-jobs-loading">
          Loading import jobs...
        </div>
      ) : (
        <>
          <div className="jobs-summary">
            <div className="summary-card">
              <span>Total Jobs</span>
              <strong>{jobs.length}</strong>
            </div>

            <div className="summary-card">
              <span>Completed</span>
              <strong>
                {jobs.filter((job) => job.status === "completed").length}
              </strong>
            </div>

            <div className="summary-card">
              <span>Failed</span>
              <strong>
                {jobs.filter((job) => job.status === "failed").length}
              </strong>
            </div>

            <div className="summary-card">
              <span>Running</span>
              <strong>
                {jobs.filter((job) => job.status === "running").length}
              </strong>
            </div>
          </div>

          <div className="import-jobs-card">
            <div className="card-header">
              <div>
                <h2>Import History</h2>
                <p>Recent book import activity</p>
              </div>
            </div>

            {currentJobs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📥</div>
                <h3>No Import Jobs</h3>
                <p>No import jobs found.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="import-jobs-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Requested</th>
                      <th>Processed</th>
                      <th>Imported</th>
                      <th>Updated</th>
                      <th>Skipped</th>
                      <th>Failed</th>
                      <th>Status</th>
                      <th>Started</th>
                      <th>Completed</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentJobs.map((job) => (
                      <tr key={job.id}>
                        <td className="job-id">#{job.id}</td>

                        <td>{job.requested_count ?? 0}</td>

                        <td>{job.processed_count ?? 0}</td>

                        <td className="imported-count">
                          {job.imported_count ?? 0}
                        </td>

                        <td>{job.updated_count ?? 0}</td>

                        <td>{job.skipped_count ?? 0}</td>

                        <td className="failed-count">
                          {job.failed_count ?? 0}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${getStatusClass(
                              job.status
                            )}`}
                          >
                            {job.status || "unknown"}
                          </span>
                        </td>

                        <td>{formatDate(job.started_at)}</td>

                        <td>{formatDate(job.completed_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {jobs.length > 0 && (
              <div className="pagination">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>

                <span>
                  Page {page} of {Math.max(totalPages, 1)}
                </span>

                <button
                  onClick={() =>
                    setPage((p) =>
                      Math.min(p + 1, Math.max(totalPages, 1))
                    )
                  }
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ImportJobs;