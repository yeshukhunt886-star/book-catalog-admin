import { useEffect, useState } from "react";
import api from "../services/api";
import "./Authors.css";

function Authors() {
  const [authors, setAuthors] = useState([]);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // GET ALL AUTHORS
  // GET /api/authors
  // =====================================================

  const fetchAuthors = async () => {
  try {
    setLoading(true);
    setError("");

    let allAuthors = [];
    let page = 1;
    const limit = 100;

    while (true) {
      const response = await api.get("/authors", {
        params: {
          page,
          limit,
        },
      });

      console.log(
        `AUTHORS RESPONSE PAGE ${page}:`,
        response.data
      );

      const data = response.data?.data;

      const pageAuthors = Array.isArray(data?.authors)
        ? data.authors
        : Array.isArray(data)
        ? data
        : [];

      allAuthors = [
        ...allAuthors,
        ...pageAuthors,
      ];

      const pagination = data?.pagination;

      if (
        !pagination ||
        !pagination.hasNextPage ||
        pageAuthors.length === 0
      ) {
        break;
      }

      page++;
    }

    console.log(
      "ALL AUTHORS:",
      allAuthors
    );

    console.log(
      "TOTAL AUTHORS:",
      allAuthors.length
    );

    setAuthors(allAuthors);

  } catch (err) {
    console.error(
      "GET ALL AUTHORS ERROR:",
      err
    );

    setError(
      err.response?.data?.message ||
        "Failed to load authors."
    );

    setAuthors([]);

  } finally {
    setLoading(false);
  }
};

  // =====================================================
  // LOAD AUTHORS ON PAGE LOAD
  // =====================================================

  useEffect(() => {
    fetchAuthors();
  }, []);

  // =====================================================
  // UPDATE AUTHOR
  // PATCH /api/authors/:id
  // =====================================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!editingId) {
      setError("Author ID is missing.");
      return;
    }

    if (!name.trim()) {
      setError("Author name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: name.trim(),
        bio: bio.trim() || null,
      };

      console.log(
        "UPDATE AUTHOR:",
        editingId,
        payload
      );

      const response = await api.patch(
        `/authors/${editingId}`,
        payload
      );

      console.log(
        "UPDATE AUTHOR RESPONSE:",
        response.data
      );

      setSuccess(
        response.data?.message ||
          "Author updated successfully."
      );

      // Clear edit form
      setName("");
      setBio("");
      setEditingId(null);

      // Reload author list
      await fetchAuthors();

    } catch (err) {
      console.error(
        "UPDATE AUTHOR ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update author."
      );

    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // START EDIT
  // =====================================================

  const handleEdit = (author) => {
    const authorId =
      author.id ||
      author.author_id;

    setEditingId(authorId);

    setName(
      author.name ||
        author.author_name ||
        ""
    );

    setBio(
      author.bio ||
        author.biography ||
        ""
    );

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // CANCEL EDIT
  // =====================================================

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setBio("");
    setError("");
    setSuccess("");
  };

  // =====================================================
  // DELETE AUTHOR
  // DELETE /api/authors/:id
  // =====================================================

  const handleDelete = async (id) => {
    if (!id) {
      setError("Author ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this author?\n\n" +
        "If this author is linked to books, the backend may prevent deletion."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      setError("");
      setSuccess("");

      console.log(
        "DELETE AUTHOR:",
        id
      );

      const response = await api.delete(
        `/authors/${id}`
      );

      console.log(
        "DELETE AUTHOR RESPONSE:",
        response.data
      );

      setSuccess(
        response.data?.message ||
          "Author deleted successfully."
      );

      // If deleted author was being edited
      if (editingId === id) {
        setEditingId(null);
        setName("");
        setBio("");
      }

      // Reload author list
      await fetchAuthors();

    } catch (err) {
      console.error(
        "DELETE AUTHOR ERROR:",
        err
      );

      // 409 = author is linked to books
      if (err.response?.status === 409) {
        setError(
          err.response?.data?.message ||
            "This author cannot be deleted because the author is linked to books."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to delete author."
        );
      }

    } finally {
      setDeletingId(null);
    }
  };

  // =====================================================
  // SEARCH AUTHORS
  // =====================================================

  const filteredAuthors = authors.filter(
    (author) => {
      const text = search
        .trim()
        .toLowerCase();

      if (!text) {
        return true;
      }

      const authorName = String(
        author.name ||
          author.author_name ||
          ""
      ).toLowerCase();

      const authorBio = String(
        author.bio ||
          author.biography ||
          ""
      ).toLowerCase();

      const authorId = String(
        author.id ||
          author.author_id ||
          ""
      ).toLowerCase();

      return (
        authorName.includes(text) ||
        authorBio.includes(text) ||
        authorId.includes(text)
      );
    }
  );

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="authors-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="authors-header">

        <div>
          <h1>Authors</h1>

          <p>
            Manage book authors.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={fetchAuthors}
          disabled={loading}
        >
          {loading
            ? "Loading..."
            : "Refresh"}
        </button>

      </div>

      {/* =================================================
          ERROR MESSAGE
      ================================================= */}

      {error && (
        <div className="authors-error">
          {error}
        </div>
      )}

      {/* =================================================
          SUCCESS MESSAGE
      ================================================= */}

      {success && (
        <div className="authors-success">
          {success}
        </div>
      )}

      {/* =================================================
          UPDATE AUTHOR FORM
      ================================================= */}

      {editingId !== null && (
        <div className="author-edit-card">

          <h2>
            Update Author
          </h2>

          <form
            onSubmit={handleUpdate}
          >

            <div className="author-form-grid">

              {/* AUTHOR NAME */}

              <div className="author-form-group">

                <label>
                  Author Name *
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  placeholder="Enter author name"
                  disabled={saving}
                />

              </div>

              {/* BIO */}

              <div className="author-form-group">

                <label>
                  Biography
                </label>

                <input
                  type="text"
                  value={bio}
                  onChange={(e) =>
                    setBio(
                      e.target.value
                    )
                  }
                  placeholder="Enter biography"
                  disabled={saving}
                />

              </div>

            </div>

            {/* FORM BUTTONS */}

            <div className="author-form-actions">

              <button
                type="submit"
                className="update-author-button"
                disabled={saving}
              >
                {saving
                  ? "Updating..."
                  : "Update Author"}
              </button>

              <button
                type="button"
                className="cancel-author-button"
                onClick={
                  handleCancelEdit
                }
                disabled={saving}
              >
                Cancel
              </button>

            </div>

          </form>

        </div>
      )}

      {/* =================================================
          AUTHOR LIST CARD
      ================================================= */}

      <div className="authors-card">

        {/* CARD HEADER */}

        <div className="authors-card-header">

          <div>

            <h2>
              Author List
            </h2>

            <span>
              {filteredAuthors.length} authors
            </span>

          </div>

          {/* SEARCH */}

          <input
            type="text"
            className="author-search"
            placeholder="Search authors..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="authors-table-wrapper">

          <table className="authors-table">

            <thead>

              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Biography</th>
                <th>Action</th>
              </tr>

            </thead>

            <tbody>

              {/* LOADING */}

              {loading ? (

                <tr>

                  <td
                    colSpan="4"
                    className="table-message"
                  >
                    Loading authors...
                  </td>

                </tr>

              ) : filteredAuthors.length === 0 ? (

                /* NO AUTHORS */

                <tr>

                  <td
                    colSpan="4"
                    className="table-message"
                  >
                    No authors found.
                  </td>

                </tr>

              ) : (

                /* AUTHOR ROWS */

                filteredAuthors.map(
                  (author, index) => {

                    const authorId =
                      author.id ||
                      author.author_id;

                    const authorName =
                      author.name ||
                      author.author_name ||
                      "-";

                    const authorBio =
                      author.bio ||
                      author.biography ||
                      "-";

                    return (

                      <tr
                        key={
                          authorId ||
                          index
                        }
                      >

                        {/* ID */}

                        <td>
                          {authorId || "-"}
                        </td>

                        {/* NAME */}

                        <td className="author-name-cell">

                          <strong>
                            {authorName}
                          </strong>

                        </td>

                        {/* BIO */}

                        <td>
                          {authorBio}
                        </td>

                        {/* ACTIONS */}

                        <td className="author-actions">

                          {/* EDIT */}

                          <button
                            type="button"
                            className="edit-author-button"
                            onClick={() =>
                              handleEdit(
                                author
                              )
                            }
                            disabled={
                              deletingId ===
                              authorId
                            }
                          >
                            Edit
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            className="delete-author-button"
                            onClick={() =>
                              handleDelete(
                                authorId
                              )
                            }
                            disabled={
                              deletingId ===
                              authorId
                            }
                          >
                            {deletingId ===
                            authorId
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </td>

                      </tr>

                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default Authors;