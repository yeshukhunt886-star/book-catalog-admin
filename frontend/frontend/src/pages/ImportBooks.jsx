import { useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./ImportBooks.css";

function ImportBooks() {
  const [keyword, setKeyword] = useState("");
  const [count, setCount] = useState(100);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    const cleanKeyword = keyword.trim();

    // =========================================
    // VALIDATION
    // =========================================

    if (!cleanKeyword) {
      setError("Keyword is required");
      setMessage("");
      setResult(null);
      return;
    }

    if (cleanKeyword.length < 2) {
      setError(
        "Keyword must contain at least 2 characters"
      );
      setMessage("");
      setResult(null);
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setError("");
      setResult(null);

      console.log("IMPORT REQUEST:", {
        keyword: cleanKeyword,
        count,
      });

      const response = await api.post(
        "/import/books",
        {
          keyword: cleanKeyword,
          count,
        }
      );

      console.log(
        "IMPORT RESPONSE:",
        response.data
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
          "Import failed"
        );
      }

      const importResult =
        response.data.data || null;

      setResult(importResult);

      // =========================================
      // NO RESULTS
      // =========================================

      if (
        Number(importResult?.fetched || 0) === 0
      ) {
        setMessage(
          "No books found for this keyword."
        );
      } else {
        setMessage(
          response.data.message ||
          "Import completed successfully."
        );
      }

    } catch (err) {
      console.error(
        "IMPORT ERROR:",
        err
      );

      // =========================================
      // RATE LIMIT
      // =========================================

      if (err.response?.status === 429) {
        const retryAfter =
          err.response?.data?.retryAfter;

        setError(
          retryAfter
            ? `Too many import requests. Please try again in ${retryAfter} seconds.`
            : "Too many import requests. Please try again later."
        );

        return;
      }

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

          {/* =========================================
              SEARCH KEYWORD
              ========================================= */}

          <div className="form-group">
            <label htmlFor="keyword">
              Search Keyword
            </label>

            <input
              id="keyword"
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setError("");
                setMessage("");
              }}
              placeholder="Enter book keyword"
              disabled={loading}
            />

            <small>
              Minimum 2 characters required
            </small>
          </div>

          {/* =========================================
              IMPORT SIZE
              ========================================= */}

          <h2>Select Import Size</h2>

          <div className="import-options">
            {[100, 500, 1000].map((value) => (
              <button
                key={value}
                type="button"
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

          {/* =========================================
              START IMPORT
              ========================================= */}

          <button
            type="button"
            className="start-import-button"
            onClick={handleImport}
            disabled={loading}
          >
            {loading
              ? "Starting Import..."
              : "Start Import"}
          </button>

          {/* =========================================
              SUCCESS / NO RESULT MESSAGE
              ========================================= */}

          {message && (
            <div className="import-success">
              {message}
            </div>
          )}

          {/* =========================================
              ERROR MESSAGE
              ========================================= */}

          {error && (
            <div className="import-error">
              {error}
            </div>
          )}

          {/* =========================================
              IMPORT RESULT
              ========================================= */}

          {result && (
            <div className="import-result">

              <h3>Import Result</h3>

              <div className="result-grid">

                <div>
                  <span>Keyword</span>
                  <strong>
                    {result.keyword ||
                      cleanKeyword}
                  </strong>
                </div>

                <div>
                  <span>Requested</span>
                  <strong>
                    {result.requested ?? count}
                  </strong>
                </div>

                <div>
                  <span>Fetched</span>
                  <strong>
                    {result.fetched ?? 0}
                  </strong>
                </div>

                <div>
                  <span>Processed</span>
                  <strong>
                    {result.processed ?? 0}
                  </strong>
                </div>

                <div>
                  <span>Inserted</span>
                  <strong>
                    {result.inserted ?? 0}
                  </strong>
                </div>

                <div>
                  <span>Updated</span>
                  <strong>
                    {result.updated ?? 0}
                  </strong>
                </div>

                <div>
                  <span>Duplicates</span>
                  <strong>
                    {result.duplicates ?? 0}
                  </strong>
                </div>

                <div>
                  <span>Skipped</span>
                  <strong>
                    {result.skipped ?? 0}
                  </strong>
                </div>

                <div>
                  <span>Failed</span>
                  <strong>
                    {result.failed ?? 0}
                  </strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>
                    {result.status || "Completed"}
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