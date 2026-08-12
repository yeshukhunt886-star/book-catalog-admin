import { useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./ImportBooks.css";

function ImportBooks() {
  const [count, setCount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    try {
      setLoading(true);
      setMessage("");
      setError("");
      setResult(null);

      console.log("IMPORT REQUEST:", count);

      const response = await api.post("/import/books", {
        count,
      });

      console.log("IMPORT RESPONSE:", response.data);

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Import failed"
        );
      }

      setMessage(
        response.data.message ||
        "Import started successfully."
      );

      setResult(response.data.data || null);

    } catch (err) {
      console.error("IMPORT ERROR:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to start import"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="import-layout">

      <Sidebar />

      <main className="import-main">

        <div className="import-header">
          <h1>Import Books</h1>

          <p>
            Import books from Open Library into
            the catalog.
          </p>
        </div>

        <div className="import-card">

          <h2>Select Import Size</h2>

          <div className="import-options">

            {[100, 500, 1000].map((value) => (
              <button
                key={value}
                className={
                  count === value
                    ? "import-option selected"
                    : "import-option"
                }
                onClick={() => setCount(value)}
                disabled={loading}
              >
                {value} Books
              </button>
            ))}

          </div>

          <div className="selected-count">
            Selected: <strong>{count}</strong> books
          </div>

          <button
            className="start-import-button"
            onClick={handleImport}
            disabled={loading}
          >
            {loading
              ? "Starting Import..."
              : "Start Import"}
          </button>

          {message && (
            <div className="import-success">
              {message}
            </div>
          )}

          {error && (
            <div className="import-error">
              {error}
            </div>
          )}

          {result && (
            <div className="import-result">

              <h3>Import Result</h3>

              <div className="result-grid">

                <div>
                  <span>Requested</span>
                  <strong>
                    {result.requestedCount ??
                      result.requested ??
                      count}
                  </strong>
                </div>

                <div>
                  <span>Imported</span>
                  <strong>
                    {result.importedCount ??
                      result.imported ??
                      0}
                  </strong>
                </div>

                <div>
                  <span>Skipped</span>
                  <strong>
                    {result.skippedCount ??
                      result.skipped ??
                      0}
                  </strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>
                    {result.status || "Started"}
                  </strong>
                </div>

              </div>

            </div>
          )}

        </div>

      </main>

    </div>
  );
}

export default ImportBooks;