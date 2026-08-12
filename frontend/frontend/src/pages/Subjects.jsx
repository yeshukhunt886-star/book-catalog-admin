import { useEffect, useState } from "react";
import api from "../services/api";
import "./Subjects.css";

function Subjects() {
  const [subjects, setSubjects] = useState([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================
  // LOAD ALL SUBJECTS
  // =========================================

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError("");

      let allSubjects = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const response = await api.get("/subjects", {
          params: {
            page,
            limit: 100,
          },
        });

        console.log(
          `SUBJECT PAGE ${page}:`,
          response.data
        );

        const data = response.data?.data || {};

        const currentSubjects =
          data.subjects || [];

        allSubjects = [
          ...allSubjects,
          ...currentSubjects,
        ];

        hasNextPage =
          data.pagination?.hasNextPage || false;

        page++;
      }

      console.log(
        "ALL SUBJECTS:",
        allSubjects.length
      );

      setSubjects(allSubjects);

    } catch (err) {
      console.error(
        "GET SUBJECTS ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load subjects."
      );

      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // =========================================
  // CREATE / UPDATE
  // =========================================

const handleSubmit = async (e) => {
  e.preventDefault();

  setError("");
  setSuccess("");

  if (!name.trim()) {
    setError("Subject name is required.");
    return;
  }

  try {
    setSaving(true);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
    };

    if (editingId) {
      // ================================
      // UPDATE SUBJECT
      // Backend uses PATCH
      // ================================

      console.log(
        "UPDATE SUBJECT:",
        editingId,
        payload
      );

      const response = await api.patch(
        `/subjects/${editingId}`,
        payload
      );

      console.log(
        "UPDATE SUBJECT RESPONSE:",
        response.data
      );

      setSuccess(
        response.data?.message ||
          "Subject updated successfully."
      );

    } else {
      // ================================
      // CREATE SUBJECT
      // ================================

      console.log(
        "CREATE SUBJECT:",
        payload
      );

      const response = await api.post(
        "/subjects",
        payload
      );

      console.log(
        "CREATE SUBJECT RESPONSE:",
        response.data
      );

      setSuccess(
        response.data?.message ||
          "Subject created successfully."
      );
    }

    // Clear form
    setName("");
    setDescription("");
    setEditingId(null);

    // Reload all subjects
    await fetchSubjects();

  } catch (err) {
    console.error(
      "SAVE SUBJECT ERROR:",
      err
    );

    setError(
      err.response?.data?.message ||
        "Failed to save subject."
    );

  } finally {
    setSaving(false);
  }
};

  // =========================================
  // EDIT
  // =========================================

  const handleEdit = (subject) => {
    setEditingId(subject.id);

    setName(
      subject.name ||
        subject.subject_name ||
        ""
    );

    setDescription(
      subject.description || ""
    );

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================
  // CANCEL EDIT
  // =========================================

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setError("");
    setSuccess("");
  };

  // =========================================
  // DELETE
  // =========================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this subject?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      console.log(
        "DELETE SUBJECT:",
        id
      );

      const response = await api.delete(
        `/subjects/${id}`
      );

      console.log(
        "DELETE SUBJECT RESPONSE:",
        response.data
      );

      setSuccess(
        response.data?.message ||
          "Subject deleted successfully."
      );

      // If deleted subject was being edited
      if (editingId === id) {
        setEditingId(null);
        setName("");
        setDescription("");
      }

      await fetchSubjects();

    } catch (err) {
      console.error(
        "DELETE SUBJECT ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete subject."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================
  // SEARCH
  // =========================================

  const filteredSubjects = subjects.filter(
    (subject) => {
      const text = search
        .trim()
        .toLowerCase();

      if (!text) {
        return true;
      }

      const subjectName = String(
        subject.name ||
          subject.subject_name ||
          ""
      ).toLowerCase();

      const subjectDescription = String(
        subject.description || ""
      ).toLowerCase();

      return (
        subjectName.includes(text) ||
        subjectDescription.includes(text)
      );
    }
  );

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="subjects-page">

      {/* HEADER */}

      <div className="subjects-header">

        <div>
          <h1>Subjects</h1>

          <p>
            Manage book subjects.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={fetchSubjects}
        >
          Refresh
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="subjects-error">
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="subjects-success">
          {success}
        </div>
      )}

      {/* CREATE / EDIT */}

      <div className="subject-create-card">

        <h2>
          {editingId
            ? "Update Subject"
            : "Create Subject"}
        </h2>

        <form onSubmit={handleSubmit}>

          <div className="subject-form-grid">

            <div className="subject-form-group">

              <label>
                Subject Name *
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Enter subject name"
              />

            </div>

            <div className="subject-form-group">

              <label>
                Description
              </label>

              <input
                type="text"
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="Enter description"
              />

            </div>

          </div>

          <div className="subject-form-actions">

            <button
              type="submit"
              className="create-subject-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Subject"
                : "Create Subject"}
            </button>

            <button
              type="button"
              className="clear-subject-button"
              onClick={
                handleCancelEdit
              }
              disabled={saving}
            >
              {editingId
                ? "Cancel"
                : "Clear"}
            </button>

          </div>

        </form>

      </div>

      {/* SUBJECT LIST */}

      <div className="subjects-card">

        <div className="subjects-card-header">

          <div>
            <h2>Subject List</h2>

            <span>
              {filteredSubjects.length} subjects
            </span>
          </div>

          <input
            type="text"
            className="subject-search"
            placeholder="Search subjects..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <div className="subjects-table-wrapper">

          <table className="subjects-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan="4"
                    className="table-message"
                  >
                    Loading subjects...
                  </td>
                </tr>

              ) : filteredSubjects.length === 0 ? (

                <tr>
                  <td
                    colSpan="4"
                    className="table-message"
                  >
                    No subjects found.
                  </td>
                </tr>

              ) : (

                filteredSubjects.map(
                  (subject, index) => {

                    const subjectId =
                      subject.id ||
                      subject.subject_id;

                    return (
                      <tr
                        key={
                          subjectId ||
                          index
                        }
                      >

                        <td>
                          {subjectId || "-"}
                        </td>

                        <td>
                          <strong>
                            {subject.name ||
                              subject.subject_name ||
                              "-"}
                          </strong>
                        </td>

                        <td>
                          {subject.description ||
                            "-"}
                        </td>

                        <td className="subject-actions">

                          <button
                            type="button"
                            className="edit-subject-button"
                            onClick={() =>
                              handleEdit(
                                subject
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-subject-button"
                            onClick={() =>
                              handleDelete(
                                subjectId
                              )
                            }
                            disabled={
                              deletingId ===
                              subjectId
                            }
                          >
                            {deletingId ===
                            subjectId
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

export default Subjects;