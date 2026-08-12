import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./SubjectDetails.css";

function SubjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [books, setBooks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        setLoading(true);
        setError("");

        console.log("SUBJECT DETAILS ID:", id);

        const response = await api.get(
          `/subjects/${id}`
        );

        console.log(
          "SUBJECT DETAILS RESPONSE:",
          response.data
        );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
            "Failed to load subject"
          );
        }

        const data = response.data?.data;

        setSubject(data?.subject || null);
        setBooks(data?.books || []);

      } catch (error) {
        console.error(
          "SUBJECT DETAILS ERROR:",
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

  if (loading) {
    return (
      <div className="subject-details-page">
        <div className="subject-details-loading">
          Loading subject...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subject-details-page">
        <div className="subject-details-error">
          {error}
        </div>

        <button
          className="subject-back-button"
          onClick={() => navigate("/subjects")}
        >
          ← Back to Subjects
        </button>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="subject-details-page">
        <div className="subject-details-error">
          Subject not found.
        </div>

        <button
          className="subject-back-button"
          onClick={() => navigate("/subjects")}
        >
          ← Back to Subjects
        </button>
      </div>
    );
  }

  return (
    <div className="subject-details-page">

      <div className="subject-details-header">

        <div>
          <h1>Subject Details</h1>
          <p>
            View subject information and associated books.
          </p>
        </div>

        <button
          className="subject-back-button"
          onClick={() => navigate("/subjects")}
        >
          ← Back to Subjects
        </button>

      </div>


      <div className="subject-details-card">

        <div className="subject-info-row">
          <span>ID</span>
          <strong>{subject.id}</strong>
        </div>

        <div className="subject-info-row">
          <span>Subject</span>
          <strong>{subject.name}</strong>
        </div>

        {subject.open_library_key && (
          <div className="subject-info-row">
            <span>Open Library Key</span>
            <strong>
              {subject.open_library_key}
            </strong>
          </div>
        )}

      </div>


      <div className="subject-books-card">

        <div className="subject-books-header">
          <h2>Associated Books</h2>

          <span>
            {books.length} book(s)
          </span>
        </div>


        {books.length === 0 ? (
          <div className="no-subject-books">
            No books are associated with this subject.
          </div>
        ) : (
          <div className="subject-books-table-wrapper">

            <table>

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>ISBN</th>
                  <th>Publisher</th>
                  <th>Year</th>
                </tr>
              </thead>

              <tbody>

                {books.map((book) => (
                  <tr key={book.id}>

                    <td>{book.id}</td>

                    <td>
                      <strong>
                        {book.title || "-"}
                      </strong>
                    </td>

                    <td>
                      {book.isbn13 ||
                        book.isbn10 ||
                        "-"}
                    </td>

                    <td>
                      {book.publisher || "-"}
                    </td>

                    <td>
                      {book.first_publish_year ||
                        book.publish_date ||
                        "-"}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default SubjectDetails;