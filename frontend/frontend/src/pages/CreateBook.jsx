import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./CreateBook.css";

function CreateBook() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    isbn10: "",
    isbn13: "",
    publisher: "",
    first_publish_year: "",
    language: "",
    description: "",
    cover_url: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Book title is required.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        isbn10: form.isbn10.trim() || null,
        isbn13: form.isbn13.trim() || null,
        publisher: form.publisher.trim() || null,
        first_publish_year: form.first_publish_year
          ? Number(form.first_publish_year)
          : null,
        language: form.language.trim() || null,
        description: form.description.trim() || null,
        cover_url: form.cover_url.trim() || null,
      };

      console.log("SENDING BOOK:", payload);

      const response = await api.post("/books", payload);

      console.log("BOOK CREATED:", response.data);

      setSuccess(
        response.data?.message ||
          "Book created successfully."
      );

      setTimeout(() => {
        navigate("/books");
      }, 800);

    } catch (err) {
      console.error("CREATE BOOK ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Failed to create book."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/books");
  };

  return (
    <div className="create-book-layout">

      <main className="create-book-main">

        {/* HEADER */}
        <div className="create-book-header">

          <div>
            <h1>Create Book</h1>

            <p>
              Add a new book to the catalog.
            </p>
          </div>

          <button
            type="button"
            className="back-button"
            onClick={handleCancel}
          >
            ← Back to Books
          </button>

        </div>

        {/* FORM CARD */}
        <div className="create-book-card">

          {error && (
            <div className="create-book-error">
              {error}
            </div>
          )}

          {success && (
            <div className="create-book-success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="form-section">

              <h2>Book Details</h2>

              <div className="form-grid">

                {/* TITLE */}
                <div className="form-group full-width">

                  <label>
                    Title <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Enter book title"
                    required
                  />

                </div>

                {/* SUBTITLE */}
                <div className="form-group full-width">

                  <label>
                    Subtitle
                  </label>

                  <input
                    type="text"
                    name="subtitle"
                    value={form.subtitle}
                    onChange={handleChange}
                    placeholder="Enter subtitle"
                  />

                </div>

                {/* ISBN 10 */}
                <div className="form-group">

                  <label>
                    ISBN-10
                  </label>

                  <input
                    type="text"
                    name="isbn10"
                    value={form.isbn10}
                    onChange={handleChange}
                    placeholder="Enter ISBN-10"
                  />

                </div>

                {/* ISBN 13 */}
                <div className="form-group">

                  <label>
                    ISBN-13
                  </label>

                  <input
                    type="text"
                    name="isbn13"
                    value={form.isbn13}
                    onChange={handleChange}
                    placeholder="Enter ISBN-13"
                  />

                </div>

                {/* PUBLISHER */}
                <div className="form-group">

                  <label>
                    Publisher
                  </label>

                  <input
                    type="text"
                    name="publisher"
                    value={form.publisher}
                    onChange={handleChange}
                    placeholder="Enter publisher"
                  />

                </div>

                {/* YEAR */}
                <div className="form-group">

                  <label>
                    Publication Year
                  </label>

                  <input
                    type="number"
                    name="first_publish_year"
                    value={form.first_publish_year}
                    onChange={handleChange}
                    placeholder="e.g. 2026"
                  />

                </div>

                {/* LANGUAGE */}
                <div className="form-group">

                  <label>
                    Language
                  </label>

                  <input
                    type="text"
                    name="language"
                    value={form.language}
                    onChange={handleChange}
                    placeholder="e.g. eng"
                  />

                </div>

                {/* COVER URL */}
                <div className="form-group">

                  <label>
                    Cover URL
                  </label>

                  <input
                    type="text"
                    name="cover_url"
                    value={form.cover_url}
                    onChange={handleChange}
                    placeholder="https://..."
                  />

                </div>

                {/* DESCRIPTION */}
                <div className="form-group full-width">

                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Enter book description"
                    rows="6"
                  />

                </div>

              </div>

            </div>

            {/* BUTTONS */}
            <div className="create-book-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-book-button"
                disabled={loading}
              >
                {loading
                  ? "Creating..."
                  : "Create Book"}
              </button>

            </div>

          </form>

        </div>

      </main>

    </div>
  );
}

export default CreateBook;

