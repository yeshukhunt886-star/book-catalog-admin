import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./EditSubject.css";

function EditSubject() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [openLibraryKey, setOpenLibraryKey] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/subjects/${id}`
        );

        console.log(
          "EDIT SUBJECT RESPONSE:",
          response.data
        );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
            "Failed to load subject"
          );
        }

        const subject =
          response.data?.data?.subject;

        if (!subject) {
          throw new Error(
            "Subject data not found"
          );
        }

        setName(subject.name || "");

        setOpenLibraryKey(
          subject.open_library_key || ""
        );

      } catch (error) {
        console.error(
          "EDIT SUBJECT LOAD ERROR:",
          error
        );

        setError(
          error.response?.data?.message ||
          error.message ||
          "Failed to load subject"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubject();
  }, [id]);


  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanName =
      name.replace(/\s+/g, " ").trim();

    if (!cleanName) {
      setError("Subject name is required");
      return;
    }

    if (cleanName.length < 2) {
      setError(
        "Subject name must contain at least 2 characters"
      );
      return;
    }

    try {
      setSaving(true);

      console.log(
        "UPDATING SUBJECT:",
        id,
        cleanName
      );

      const response = await api.patch(
        `/subjects/${id}`,
        {
          name: cleanName
        }
      );

      console.log(
        "UPDATE SUBJECT RESPONSE:",
        response.data
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
          "Failed to update subject"
        );
      }

      setSuccess(
        "Subject updated successfully."
      );

      setName(
        response.data?.data?.name ||
        cleanName
      );

      setTimeout(() => {
        navigate("/subjects");
      }, 800);

    } catch (error) {
      console.error(
        "UPDATE SUBJECT ERROR:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.message ||
        "Failed to update subject"
      );
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="edit-subject-page">
        <div className="edit-subject-loading">
          Loading subject...
        </div>
      </div>
    );
  }


  return (
    <div className="edit-subject-page">

      <div className="edit-subject-header">

        <div>
          <h1>Edit Subject</h1>
          <p>
            Update subject information.
          </p>
        </div>

        <button
          type="button"
          className="subject-back-button"
          onClick={() =>
            navigate("/subjects")
          }
        >
          ← Back to Subjects
        </button>

      </div>


      <div className="edit-subject-card">

        {error && (
          <div className="edit-subject-error">
            {error}
          </div>
        )}

        {success && (
          <div className="edit-subject-success">
            {success}
          </div>
        )}


        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label>
              Subject ID
            </label>

            <input
              type="text"
              value={id}
              disabled
            />

          </div>


          <div className="form-group">

            <label>
              Subject Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Enter subject name"
              disabled={saving}
            />

          </div>


          <div className="form-group">

            <label>
              Open Library Key
            </label>

            <input
              type="text"
              value={openLibraryKey}
              disabled
            />

          </div>


          <div className="edit-subject-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() =>
                navigate("/subjects")
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
                : "Update Subject"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default EditSubject;