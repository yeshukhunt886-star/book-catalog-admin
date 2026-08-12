import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./EditAuthor.css";

function EditAuthor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [openLibraryKey, setOpenLibraryKey] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD AUTHOR
  // =====================================================

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        setLoading(true);
        setError("");

        console.log("EDIT AUTHOR ID:", id);

        const response = await api.get(
          `/authors/${id}`
        );

        console.log(
          "EDIT AUTHOR RESPONSE:",
          response.data
        );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
            "Failed to load author"
          );
        }

        const author =
          response.data?.data?.author;

        if (!author) {
          throw new Error(
            "Author data not found"
          );
        }

        setName(author.name || "");

        setOpenLibraryKey(
          author.open_library_key || ""
        );

      } catch (err) {
        console.error(
          "EDIT AUTHOR LOAD ERROR:",
          err
        );

        setError(
          err.response?.data?.message ||
          err.message ||
          "Failed to load author"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAuthor();
  }, [id]);


  // =====================================================
  // UPDATE AUTHOR
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanName =
      name.replace(/\s+/g, " ").trim();

    if (!cleanName) {
      setError(
        "Author name is required"
      );
      return;
    }

    if (cleanName.length < 2) {
      setError(
        "Author name must contain at least 2 characters"
      );
      return;
    }

    if (cleanName.length > 255) {
      setError(
        "Author name must not exceed 255 characters"
      );
      return;
    }

    try {
      setSaving(true);

      console.log(
        "UPDATING AUTHOR:",
        id,
        cleanName
      );

      const response = await api.patch(
        `/authors/${id}`,
        {
          name: cleanName
        }
      );

      console.log(
        "UPDATE AUTHOR RESPONSE:",
        response.data
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
          "Failed to update author"
        );
      }

      setSuccess(
        "Author updated successfully."
      );

      setName(
        response.data?.data?.name ||
        cleanName
      );

      // Go back to authors after short delay
      setTimeout(() => {
        navigate("/authors");
      }, 800);

    } catch (err) {
      console.error(
        "UPDATE AUTHOR ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to update author"
      );
    } finally {
      setSaving(false);
    }
  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="edit-author-page">
        <div className="edit-author-loading">
          Loading author...
        </div>
      </div>
    );
  }


  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="edit-author-page">

      <div className="edit-author-header">

        <div>
          <h1>
            Edit Author
          </h1>

          <p>
            Update author information.
          </p>
        </div>

        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate("/authors")
          }
        >
          ← Back to Authors
        </button>

      </div>


      <div className="edit-author-card">

        {error && (
          <div className="edit-author-error">
            {error}
          </div>
        )}

        {success && (
          <div className="edit-author-success">
            {success}
          </div>
        )}


        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label htmlFor="authorId">
              Author ID
            </label>

            <input
              id="authorId"
              type="text"
              value={id}
              disabled
            />

          </div>


          <div className="form-group">

            <label htmlFor="authorName">
              Author Name
            </label>

            <input
              id="authorName"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Enter author name"
              disabled={saving}
            />

          </div>


          <div className="form-group">

            <label htmlFor="openLibraryKey">
              Open Library Key
            </label>

            <input
              id="openLibraryKey"
              type="text"
              value={openLibraryKey}
              disabled
            />

            <small>
              Open Library key cannot be changed here.
            </small>

          </div>


          <div className="form-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() =>
                navigate("/authors")
              }
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Update Author"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default EditAuthor;