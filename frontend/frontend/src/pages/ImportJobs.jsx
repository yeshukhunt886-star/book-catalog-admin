import { useEffect, useState } from "react";
import api from "../services/api";
import "./ImportJobs.css";

function ImportJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const fetchImportJobs = async (currentPage = page) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/import/jobs", {
        params: {
          page: currentPage,
          limit,
        },
      });

      console.log("IMPORT JOBS RESPONSE:", response.data);

      if (response.data?.success) {
        setJobs(response.data.data || []);

        setPagination(
          response.data.pagination || {
            page: currentPage,
            limit,
            total: response.data.data?.length || 0,
            totalPages: 1,
          }
        );
      } else {
        setJobs([]);
        setError(
          response.data?.message || "Failed to load import jobs"
        );
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
    fetchImportJobs(page);
  }, [page]);

  /*
  =====================================================
  STATUS COUNTS
  =====================================================
  */

  const totalJobs = pagination.total;

  const completedJobs = jobs.filter(
    (job) => job.status === "completed"
  ).length;

  const failedJobs = jobs.filter(
    (job) => job.status === "failed"
  ).length;

  const runningJobs = jobs.filter(
    (job) => job.status === "running"
  ).length;

  const partiallyCompletedJobs = jobs.filter(
    (job) => job.status === "partially_completed"
  ).length;

  /*
  =====================================================
  FORMAT DATE
  =====================================================
  */

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString();
  };

  /*
  =====================================================
  STATUS CLASS
  =====================================================
  */

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "status-completed";

      case "failed":
        return "status-failed";

      case "running":
        return "status-running";

      case "cancelled":
        return "status-cancelled";

      case "partially_completed":
        return "status-partially";

      default:
        return "status-default";
    }
  };

  /*
  =====================================================
  STATUS LABEL
  =====================================================
  */

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed":
        return "Completed";

      case "failed":
        return "Failed";

      case "running":
        return "Running";

      case "cancelled":
        return "Cancelled";

      case "partially_completed":
        return "Partially Completed";

      default:
        return "Unknown";
    }
  };

  /*
  =====================================================
  REFRESH
  =====================================================
  */

  const handleRefresh = () => {
    fetchImportJobs(page);
  };

  /*
  =====================================================
  PAGINATION
  =====================================================
  */

  const totalPages = Math.max(
    Number(pagination.totalPages) || 1,
    1
  );

  const currentPage = Number(pagination.page) || page;

  const goToPreviousPage = () => {
    setPage((previousPage) =>
      Math.max(previousPage - 1, 1)
    );
  };

  const goToNextPage = () => {
    setPage((previousPage) =>
      Math.min(previousPage + 1, totalPages)
    );
  };

  return (
    <div className="import-jobs-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="import-jobs-header">

        <div>
          <h1>Import Jobs</h1>

          <p>
            View and monitor book import jobs
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={handleRefresh}
          disabled={loading}
        >
          ↻ Refresh
        </button>

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="import-jobs-error">
          {error}
        </div>
      )}


      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <div className="import-jobs-loading">
          Loading import jobs...
        </div>
      ) : (
        <>

          {/* =====================================================
              SUMMARY
          ===================================================== */}

          <div className="jobs-summary">

            <div className="summary-card">
              <span>Total Jobs</span>
              <strong>{totalJobs}</strong>
            </div>


            <div className="summary-card">
              <span>Completed</span>

              <strong>
                {completedJobs}
              </strong>
            </div>


            <div className="summary-card">
              <span>Failed</span>

              <strong>
                {failedJobs}
              </strong>
            </div>


            <div className="summary-card">
              <span>Running</span>

              <strong>
                {runningJobs}
              </strong>
            </div>


            <div className="summary-card">
              <span>Partial</span>

              <strong>
                {partiallyCompletedJobs}
              </strong>
            </div>

          </div>


          {/* =====================================================
              IMPORT HISTORY
          ===================================================== */}

          <div className="import-jobs-card">

            <div className="card-header">

              <div>
                <h2>Import History</h2>

                <p>
                  Recent book import activity
                </p>
              </div>

            </div>


            {/* =====================================================
                EMPTY STATE
            ===================================================== */}

            {jobs.length === 0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  📥
                </div>

                <h3>
                  No Import Jobs
                </h3>

                <p>
                  No import jobs found.
                </p>

              </div>

            ) : (

              /* =====================================================
                 TABLE
              ===================================================== */

              <div className="table-wrapper">

                <table className="import-jobs-table">

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

                      <th>Started</th>

                      <th>Completed</th>

                    </tr>

                  </thead>


                  <tbody>

                    {jobs.map((job) => (

                      <tr key={job.id}>

                        {/* ID */}

                        <td className="job-id">
                          #{job.id}
                        </td>


                        {/* ADMIN ID */}

                        <td>
                          {job.admin_id ?? "-"}
                        </td>


                        {/* REQUESTED */}

                        <td>
                          {job.requested_count ?? 0}
                        </td>


                        {/* PROCESSED */}

                        <td>
                          {job.processed_count ?? 0}
                        </td>


                        {/* IMPORTED */}

                        <td className="imported-count">
                          {job.imported_count ?? 0}
                        </td>


                        {/* UPDATED */}

                        <td>
                          {job.updated_count ?? 0}
                        </td>


                        {/* SKIPPED */}

                        <td>
                          {job.skipped_count ?? 0}
                        </td>


                        {/* FAILED */}

                        <td className="failed-count">
                          {job.failed_count ?? 0}
                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            className={`status-badge ${getStatusClass(
                              job.status
                            )}`}
                          >
                            {getStatusLabel(
                              job.status
                            )}
                          </span>

                        </td>


                        {/* STARTED */}

                        <td>
                          {formatDate(
                            job.started_at
                          )}
                        </td>


                        {/* COMPLETED */}

                        <td>
                          {formatDate(
                            job.completed_at
                          )}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}


            {/* =====================================================
                PAGINATION
            ===================================================== */}

            {pagination.total > 0 && (

              <div className="pagination">

                <button
                  onClick={goToPreviousPage}
                  disabled={
                    loading ||
                    currentPage <= 1
                  }
                >
                  Previous
                </button>


                <span>
                  Page {currentPage} of {totalPages}
                </span>


                <button
                  onClick={goToNextPage}
                  disabled={
                    loading ||
                    currentPage >= totalPages
                  }
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