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
    language: "",
    coverId: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD BOOK
  // =====================================================

  useEffect(() => {
    loadBook();
  }, [id]);

  const loadBook = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/books/${id}`);

      console.log("BOOK DETAILS:", response.data);

      const data = response.data?.data;
      const book = data?.book || data;

      if (!book) {
        setError("Book not found");
        return;
      }

      setFormData({
        title: book.title ?? "",
        subtitle: book.subtitle ?? "",
        isbn10: book.isbn10 ?? "",
        isbn13: book.isbn13 ?? "",
        publisher: book.publisher ?? "",

        publishYear:
          book.publishYear ??
          book.publish_year ??
          book.first_publish_year ??
          "",

        language: book.language ?? "",

        coverId:
          book.coverId ??
          book.cover_id ??
          "",
      });
    } catch (err) {
      console.error("LOAD BOOK ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to load book"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =====================================================
  // UPDATE BOOK
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // ---------------------------------------------
      // VALIDATION
      // ---------------------------------------------

      if (!formData.title.trim()) {
        setError("Book title is required");
        setSaving(false);
        return;
      }

      // ---------------------------------------------
      // PAYLOAD
      // ---------------------------------------------

      const payload = {
        title: formData.title.trim(),

        subtitle: formData.subtitle.trim() || null,

        isbn10: formData.isbn10.trim() || null,

        isbn13: formData.isbn13.trim() || null,

        publisher: formData.publisher.trim() || null,

        publishYear:
          formData.publishYear !== ""
            ? Number(formData.publishYear)
            : null,

        language: formData.language.trim() || null,

        coverId:
          formData.coverId !== ""
            ? Number(formData.coverId)
            : null,
      };

      console.log("UPDATE BOOK ID:", id);
      console.log("UPDATE BOOK PAYLOAD:", payload);

      // ---------------------------------------------
      // API REQUEST
      // PATCH /api/books/:id
      // ---------------------------------------------

      const response = await api.patch(
        `/books/${id}`,
        payload
      );

      console.log(
        "UPDATE BOOK RESPONSE:",
        response.data
      );

      // ---------------------------------------------
      // SUCCESS
      // ---------------------------------------------

      if (
        response.data?.success === true ||
        response.data?.status === "success"
      ) {
        setSuccess(
          response.data?.message ||
            "Book updated successfully"
        );

        setTimeout(() => {
          navigate("/books");
        }, 1500);

        return;
      }

      // Some APIs return updated data without success=true
      if (response.data?.data) {
        setSuccess(
          response.data?.message ||
            "Book updated successfully"
        );

        setTimeout(() => {
          navigate("/books");
        }, 1500);

        return;
      }

      setError(
        response.data?.message ||
          "Book update failed"
      );
    } catch (err) {
      console.error("UPDATE BOOK ERROR:", err);

      console.error(
        "UPDATE BOOK STATUS:",
        err.response?.status
      );

      console.error(
        "UPDATE BOOK SERVER RESPONSE:",
        err.response?.data
      );

      // ---------------------------------------------
      // BACKEND ERROR MESSAGE
      // ---------------------------------------------

      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.errors;

      if (Array.isArray(serverMessage)) {
        setError(serverMessage.join(", "));
      } else if (
        typeof serverMessage === "object" &&
        serverMessage !== null
      ) {
        setError(
          Object.values(serverMessage)
            .flat()
            .join(", ")
        );
      } else {
        setError(
          serverMessage ||
            "Failed to update book"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // CANCEL
  // =====================================================

  const handleCancel = () => {
    navigate("/books");
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="edit-book-page">
        <div className="edit-book-loading">
          Loading book...
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="edit-book-page">
      <div className="edit-book-container">

        {/* HEADER */}

        <div className="edit-book-header">
          <div>
            <h1>Edit Book</h1>

            <p>
              Update book information.
            </p>
          </div>

          <button
            type="button"
            className="back-button"
            onClick={handleCancel}
            disabled={saving}
          >
            Back to Books
          </button>
        </div>

        {/* SUCCESS */}

        {success && (
          <div className="edit-book-success">
            {success}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="edit-book-error">
            {error}
          </div>
        )}

        {/* FORM */}

        <form
          className="edit-book-form"
          onSubmit={handleSubmit}
        >

          {/* TITLE */}

          <div className="form-group">
            <label>Title *</label>

            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter book title"
              required
              disabled={saving}
            />
          </div>

          {/* SUBTITLE */}

          <div className="form-group">
            <label>Subtitle</label>

            <input
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              placeholder="Enter subtitle"
              disabled={saving}
            />
          </div>

          {/* ISBN 10 */}

          <div className="form-group">
            <label>ISBN-10</label>

            <input
              type="text"
              name="isbn10"
              value={formData.isbn10}
              onChange={handleChange}
              placeholder="Enter ISBN-10"
              disabled={saving}
            />
          </div>

          {/* ISBN 13 */}

          <div className="form-group">
            <label>ISBN-13</label>

            <input
              type="text"
              name="isbn13"
              value={formData.isbn13}
              onChange={handleChange}
              placeholder="Enter ISBN-13"
              disabled={saving}
            />
          </div>

          {/* PUBLISHER */}

          <div className="form-group">
            <label>Publisher</label>

            <input
              type="text"
              name="publisher"
              value={formData.publisher}
              onChange={handleChange}
              placeholder="Enter publisher"
              disabled={saving}
            />
          </div>

          {/* PUBLISH YEAR */}

          <div className="form-group">
            <label>Publish Year</label>

            <input
              type="number"
              name="publishYear"
              value={formData.publishYear}
              onChange={handleChange}
              placeholder="Enter publish year"
              disabled={saving}
            />
          </div>

          {/* LANGUAGE */}

          <div className="form-group">
            <label>Language</label>

            <input
              type="text"
              name="language"
              value={formData.language}
              onChange={handleChange}
              placeholder="e.g. eng"
              disabled={saving}
            />
          </div>

          {/* COVER ID */}

          <div className="form-group">
            <label>Cover ID</label>

            <input
              type="number"
              name="coverId"
              value={formData.coverId}
              onChange={handleChange}
              placeholder="Enter cover ID"
              disabled={saving}
            />
          </div>

          {/* BUTTONS */}

          <div className="edit-book-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="update-button"
              disabled={saving}
            >
              {saving
                ? "Updating..."
                : "Update Book"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

export default EditBook;