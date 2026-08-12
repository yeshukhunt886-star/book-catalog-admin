
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./EditBook.css";

function EditBook() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    isbn10: "",
    isbn13: "",
    publisher: "",
    publishYear: "",
    description: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchBook();
  }, [id]);

  const fetchBook = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/books/${id}`);

      console.log("EDIT BOOK DETAILS:", response.data);

      const book = response.data?.data;

      if (!book) {
        throw new Error("Book data not found");
      }

      setFormData({
        title: book.title || "",
        subtitle: book.subtitle || "",
        isbn10: book.isbn10 || "",
        isbn13: book.isbn13 || "",
        publisher: book.publisher || "",
        publishYear:
          book.publishYear ||
          book.publishedYear ||
          book.year ||
          "",
        description: book.description || "",
      });

    } catch (err) {
      console.error("EDIT BOOK LOAD ERROR:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to load book"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await api.put(
        `/books/${id}`,
        formData
      );

      console.log("UPDATE BOOK RESPONSE:", response.data);

      if (response.data?.success === false) {
        throw new Error(
          response.data.message || "Update failed"
        );
      }

      setSuccess("Book updated successfully.");

      setTimeout(() => {
        navigate("/books");
      }, 1000);

    } catch (err) {
      console.error("UPDATE BOOK ERROR:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to update book"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-book-page">
        <div className="edit-book-card">
          <p className="loading-message">
            Loading book...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-book-page">

      <div className="edit-book-card">

        <div className="edit-book-header">

          <div>
            <h1>Edit Book</h1>
            <p>Book ID: {id}</p>
          </div>

          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/books")}
          >
            Back to Books
          </button>

        </div>

        {error && (
          <div className="edit-error">
            {error}
          </div>
        )}

        {success && (
          <div className="edit-success">
            {success}
          </div>
        )}

        <form
          className="edit-book-form"
          onSubmit={handleSubmit}
        >

          <div className="form-row">

            <div className="form-group">
              <label>Title</label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Subtitle</label>

              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
              />
            </div>

          </div>

          <div className="form-row">

            <div className="form-group">
              <label>ISBN-10</label>

              <input
                type="text"
                name="isbn10"
                value={formData.isbn10}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>ISBN-13</label>

              <input
                type="text"
                name="isbn13"
                value={formData.isbn13}
                onChange={handleChange}
              />
            </div>

          </div>

          <div className="form-row">

            <div className="form-group">
              <label>Publisher</label>

              <input
                type="text"
                name="publisher"
                value={formData.publisher}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Publish Year</label>

              <input
                type="number"
                name="publishYear"
                value={formData.publishYear}
                onChange={handleChange}
              />
            </div>

          </div>

          <div className="form-group">

            <label>Description</label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="6"
            />

          </div>

          <div className="form-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate("/books")}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default EditBook;
