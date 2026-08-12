import { useEffect, useState } from "react";
import api from "../services/api";
import "./AuditLogs.css";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [module, setModule] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.append("page", page);
      params.append("limit", 20);

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (action.trim()) {
        params.append("action", action.trim());
      }

      if (module.trim()) {
        params.append("module", module.trim());
      }

      const response = await api.get(
        `/audit-logs?${params.toString()}`
      );

      if (response.data?.success) {
        setLogs(response.data.data?.logs || []);

        setPagination(
          response.data.data?.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          }
        );
      } else {
        setError(
          response.data?.message || "Failed to load audit logs"
        );
      }
    } catch (err) {
      console.error("AUDIT LOGS ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load audit logs"
      );

      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();

    setPage(1);

    setTimeout(() => {
      fetchAuditLogs();
    }, 0);
  };

  const clearFilters = () => {
    setSearch("");
    setAction("");
    setModule("");
    setPage(1);

    setTimeout(() => {
      fetchAuditLogs();
    }, 0);
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString();
  };

  return (
    <div className="audit-logs-page">

      {/* Header */}
      <div className="audit-header">
        <div>
          <h1>Audit Logs</h1>
          <p>
            Track administrator actions and system activity.
          </p>
        </div>

        <div className="audit-total">
          <span>Total Logs</span>
          <strong>{pagination.total}</strong>
        </div>
      </div>

      {/* Filters */}
      <div className="audit-filters">

        <form onSubmit={handleSearch}>

          <div className="filter-group">
            <label>Search</label>

            <input
              type="text"
              placeholder="Search audit logs..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          <div className="filter-group">
            <label>Action</label>

            <input
              type="text"
              placeholder="e.g. IMPORT_BOOKS"
              value={action}
              onChange={(e) =>
                setAction(e.target.value)
              }
            />
          </div>

          <div className="filter-group">
            <label>Module</label>

            <input
              type="text"
              placeholder="e.g. import"
              value={module}
              onChange={(e) =>
                setModule(e.target.value)
              }
            />
          </div>

          <div className="filter-buttons">

            <button
              type="submit"
              className="search-button"
            >
              Search
            </button>

            <button
              type="button"
              className="clear-button"
              onClick={clearFilters}
            >
              Clear
            </button>

          </div>

        </form>

      </div>

      {/* Error */}
      {error && (
        <div className="audit-error">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="audit-loading">
          Loading audit logs...
        </div>
      ) : logs.length === 0 ? (
        <div className="audit-empty">
          <div className="empty-icon">📝</div>

          <h3>No Audit Logs Found</h3>

          <p>
            There are no audit logs matching your filters.
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="audit-table-container">

            <table className="audit-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Record ID</th>
                  <th>Admin ID</th>
                  <th>Description</th>
                  <th>IP Address</th>
                  <th>Performed At</th>
                </tr>
              </thead>

              <tbody>

                {logs.map((log) => (
                  <tr key={log.id}>

                    <td>
                      #{log.id}
                    </td>

                    <td>
                      <span className="action-badge">
                        {log.action || "-"}
                      </span>
                    </td>

                    <td>
                      <span className="module-badge">
                        {log.module || "-"}
                      </span>
                    </td>

                    <td>
                      {log.recordId ?? "-"}
                    </td>

                    <td>
                      {log.adminId ?? "-"}
                    </td>

                    <td className="description-cell">
                      {log.description || "-"}
                    </td>

                    <td>
                      {log.ipAddress || "-"}
                    </td>

                    <td>
                      {formatDate(log.performedAt)}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

          {/* Pagination */}
          <div className="audit-pagination">

            <button
              disabled={!pagination.hasPreviousPage}
              onClick={() =>
                setPage((prev) => prev - 1)
              }
            >
              ← Previous
            </button>

            <span>
              Page{" "}
              <strong>
                {pagination.page}
              </strong>{" "}
              of{" "}
              <strong>
                {pagination.totalPages || 1}
              </strong>
            </span>

            <button
              disabled={!pagination.hasNextPage}
              onClick={() =>
                setPage((prev) => prev + 1)
              }
            >
              Next →
            </button>

          </div>
        </>
      )}

    </div>
  );
}

export default AuditLogs;