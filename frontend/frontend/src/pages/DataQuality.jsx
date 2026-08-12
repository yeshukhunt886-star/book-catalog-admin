import { useEffect, useState } from "react";
import api from "../services/api";
import "./dataquality.css";

function DataQuality() {
  const [quality, setQuality] = useState({
    totalBooks: 0,
    averageQualityScore: 0,
    highQualityBooks: 0,
    mediumQualityBooks: 0,
    lowQualityBooks: 0,

    missingISBN10: 0,
    missingISBN13: 0,
    missingPublisher: 0,
    missingLanguage: 0,
    missingPageCount: 0,
    missingCover: 0,
    missingPublishYear: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDataQuality();
  }, []);

  const fetchDataQuality = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/data-quality");

      console.log("DATA QUALITY RESPONSE:", response.data);

      const data = response.data?.data || {};

      const summary = data.summary || {};
      const missingData = data.missingData || {};

      setQuality({
        totalBooks: Number(summary.totalBooks || 0),

        averageQualityScore: Number(
          summary.averageQualityScore || 0
        ),

        highQualityBooks: Number(
          summary.highQualityBooks || 0
        ),

        mediumQualityBooks: Number(
          summary.mediumQualityBooks || 0
        ),

        lowQualityBooks: Number(
          summary.lowQualityBooks || 0
        ),

        missingISBN10: Number(
          missingData.isbn10 || 0
        ),

        missingISBN13: Number(
          missingData.isbn13 || 0
        ),

        missingPublisher: Number(
          missingData.publisher || 0
        ),

        missingLanguage: Number(
          missingData.language || 0
        ),

        missingPageCount: Number(
          missingData.pageCount || 0
        ),

        missingCover: Number(
          missingData.cover || 0
        ),

        missingPublishYear: Number(
          missingData.publishYear || 0
        ),
      });
    } catch (err) {
      console.error("DATA QUALITY ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load data quality information."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="data-quality-page">
        <div className="data-quality-loading">
          Loading data quality...
        </div>
      </div>
    );
  }

  return (
    <div className="data-quality-page">

      {/* HEADER */}
      <div className="data-quality-header">
        <div>
          <h1>Data Quality</h1>

          <p>
            Monitor and validate the quality of your book
            catalog data.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={fetchDataQuality}
        >
          Refresh
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="data-quality-error">
          {error}
        </div>
      )}

      {/* OVERALL QUALITY */}
      <section className="quality-overall-card">

        <div className="quality-overall-content">

          <h2>Overall Data Quality</h2>

          <p>
            Average quality score across{" "}
            <strong>{quality.totalBooks}</strong>{" "}
            books.
          </p>

          <p>
            High quality:{" "}
            <strong>{quality.highQualityBooks}</strong>
            {" | "}
            Medium:{" "}
            <strong>{quality.mediumQualityBooks}</strong>
            {" | "}
            Low:{" "}
            <strong>{quality.lowQualityBooks}</strong>
          </p>

        </div>

        <div className="quality-score">
          <strong>
            {quality.averageQualityScore.toFixed(1)}
          </strong>
        </div>

      </section>

      {/* QUALITY STATISTICS */}
      <section className="data-quality-stats">

        <div className="quality-stat-card">

          <div className="quality-stat-icon books">
            📚
          </div>

          <div>
            <span className="quality-stat-label">
              Total Books
            </span>

            <strong className="quality-stat-value">
              {quality.totalBooks}
            </strong>
          </div>

        </div>


        <div className="quality-stat-card">

          <div className="quality-stat-icon valid">
            ✓
          </div>

          <div>
            <span className="quality-stat-label">
              High Quality
            </span>

            <strong className="quality-stat-value">
              {quality.highQualityBooks}
            </strong>
          </div>

        </div>


        <div className="quality-stat-card">

          <div className="quality-stat-icon invalid">
            !
          </div>

          <div>
            <span className="quality-stat-label">
              Low Quality
            </span>

            <strong className="quality-stat-value">
              {quality.lowQualityBooks}
            </strong>
          </div>

        </div>


        <div className="quality-stat-card">

          <div className="quality-stat-icon duplicate">
            ⚠
          </div>

          <div>
            <span className="quality-stat-label">
              Medium Quality
            </span>

            <strong className="quality-stat-value">
              {quality.mediumQualityBooks}
            </strong>
          </div>

        </div>

      </section>


      {/* DATA ISSUES */}
      <section className="data-issues-card">

        <div className="data-issues-header">

          <h2>Data Issues</h2>

          <p>
            Missing data detected in your book catalog.
          </p>

        </div>


        <div className="issue-grid">

          {/* ISBN 10 */}
          <div className="issue-card">

            <div className="issue-icon">
              🔢
            </div>

            <div>
              <h3>Missing ISBN-10</h3>

              <strong>
                {quality.missingISBN10}
              </strong>
            </div>

          </div>


          {/* ISBN 13 */}
          <div className="issue-card">

            <div className="issue-icon">
              🔢
            </div>

            <div>
              <h3>Missing ISBN-13</h3>

              <strong>
                {quality.missingISBN13}
              </strong>
            </div>

          </div>


          {/* Publisher */}
          <div className="issue-card">

            <div className="issue-icon">
              🏢
            </div>

            <div>
              <h3>Missing Publisher</h3>

              <strong>
                {quality.missingPublisher}
              </strong>
            </div>

          </div>


          {/* Language */}
          <div className="issue-card">

            <div className="issue-icon">
              🌐
            </div>

            <div>
              <h3>Missing Language</h3>

              <strong>
                {quality.missingLanguage}
              </strong>
            </div>

          </div>


          {/* Page Count */}
          <div className="issue-card">

            <div className="issue-icon">
              📄
            </div>

            <div>
              <h3>Missing Page Count</h3>

              <strong>
                {quality.missingPageCount}
              </strong>
            </div>

          </div>


          {/* Cover */}
          <div className="issue-card">

            <div className="issue-icon">
              🖼️
            </div>

            <div>
              <h3>Missing Cover</h3>

              <strong>
                {quality.missingCover}
              </strong>
            </div>

          </div>


          {/* Publish Year */}
          <div className="issue-card">

            <div className="issue-icon">
              📅
            </div>

            <div>
              <h3>Missing Publish Year</h3>

              <strong>
                {quality.missingPublishYear}
              </strong>
            </div>

          </div>

        </div>

      </section>


      {/* QUALITY ISSUES */}
      <section className="quality-issues-card">

        <div className="quality-issues-header">

          <h2>Quality Issues</h2>

          <p>
            Detailed data quality problems.
          </p>

        </div>


        <div className="no-quality-issues">

          <div className="no-quality-icon">
            !
          </div>

          <h3>
            Data quality issues detected
          </h3>

          <p>
            Your catalog contains books with missing
            information. Review the Data Issues section
            above.
          </p>

        </div>

      </section>

    </div>
  );
}

export default DataQuality;