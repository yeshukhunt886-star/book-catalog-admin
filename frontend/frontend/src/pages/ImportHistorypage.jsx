import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./ImportHistory.css";

function ImportHistory() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/import-jobs/history"
      );

      console.log(
        "IMPORT HISTORY RESPONSE:",
        response.data
      );

      const data = response.data?.data || {};

      setHistory(
        data.history ||
        data.jobs ||
        data.imports ||
        (Array.isArray(data) ? data : [])
      );
    } catch (err) {
      console.error(
        "IMPORT HISTORY ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to load import history"
      );

      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getStatusClass = (status) => {
    const value = String(
      status || ""
    ).toLowerCase();

    if (
      value === "completed" ||
      value === "success"
    ) {
      return "status completed";
    }

    if (
      value === "running" ||
      value === "processing"
    ) {
      return "status running";
    }

    if (value === "failed") {
      return "status failed";
    }

    if (
      value === "cancelled" ||
      value === "canceled"
    ) {
      return "status cancelled";
    }

    return "status pending";
  };

  return (
    <div className="history-layout">

      <Sidebar />

      <main className="history-main">

        <div className="history-header">

          <div>
            <h1>Import History</h1>

            <p>
              View previous book import jobs and logs.
            </p>
          </div>

          <button
            className="refresh-history-button"
            onClick={fetchHistory}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "Refresh"}
          </button>

        </div>

        {error && (
          <div className="history-error">
            {error}
          </div>
        )}

        <div className="history-card">

          <div className="table-wrapper">

            <table className="history-table">

              <thead>

                <tr>
                  <th>ID</th>
                  <th>Admin ID</th>
                  <th>Requested</th>
                  <th>Imported</th>
                  <th>Skipped</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Completed</th>
                  <th>Action</th>
                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>
                    <td
                      colSpan="9"
                      className="table-message"
                    >
                      Loading import history...
                    </td>
                  </tr>

                ) : history.length === 0 ? (

                  <tr>
                    <td
                      colSpan="9"
                      className="table-message"
                    >
                      No import history found.
                    </td>
                  </tr>

                ) : (

                  history.map((job) => (

                    <tr key={job.id}>

                      <td>
                        {job.id}
                      </td>

                      <td>
                        {job.adminId ??
                          job.admin_id ??
                          "-"}
                      </td>

                      <td>
                        {job.requestedCount ??
                          job.requested_count ??
                          job.requested ??
                          0}
                      </td>

                      <td>
                        {job.importedCount ??
                          job.imported_count ??
                          job.imported ??
                          0}
                      </td>

                      <td>
                        {job.skippedCount ??
                          job.skipped_count ??
                          job.skipped ??
                          0}
                      </td>

                      <td>

                        <span
                          className={getStatusClass(
                            job.status
                          )}
                        >
                          {job.status ||
                            "pending"}
                        </span>

                      </td>

                      <td>
                        {job.startedAt ??
                          job.started_at ??
                          "-"}
                      </td>

                      <td>
                        {job.completedAt ??
                          job.completed_at ??
                          "-"}
                      </td>

                      <td>

                        <button
                          className="view-job-button"
                          onClick={() =>
                            navigate(
                              `/import-jobs/${job.id}`
                            )
                          }
                        >
                          View
                        </button>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

      </main>

    </div>
  );
}

export default ImportHistory;