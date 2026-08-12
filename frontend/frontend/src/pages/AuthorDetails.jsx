import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./AuthorDetails.css";

function AuthorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [author, setAuthor] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAuthorDetails = async () => {
      try {
        setLoading(true);
        setError("");

        console.log("AUTHOR ID:", id);

        const response = await api.get(`/authors/${id}`);

        console.log(
          "AUTHOR DETAILS RESPONSE:",
          response.data
        );

        if (response.data?.success) {
          const data = response.data.data;

          setAuthor(data?.author || null);
          setBooks(data?.books || []);
        } else {
          setError(
            response.data?.message ||
            "Failed to load author"
          );
        }
      } catch (error) {
        console.error(
          "AUTHOR DETAILS ERROR:",
          error
        );

        setError(
          error.response?.data?.message ||
          "Failed to load author details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="author-details-page">
        <div className="author-loading">
          Loading author details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="author-details-page">

        <div className="author-details-header">
          <div>
            <h1>Author Details</h1>
            <p>View author information.</p>
          </div>

          <button
            className="back-button"
            onClick={() => navigate("/authors")}
          >
            ← Back
          </button>
        </div>

        <div className="author-error">
          {error}
        </div>

      </div>
    );
  }

  return (
    <div className="author-details-page">

      {/* HEADER */}

      <div className="author-details-header">

        <div>
          <h1>Author Details</h1>

          <p>
            View author information and associated books.
          </p>
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/authors")}
        >
          ← Back to Authors
        </button>

      </div>


      {/* AUTHOR INFORMATION */}

      {author && (
        <div className="author-card">

          <div className="author-card-header">

            <div>
              <h2>
                {author.name}
              </h2>

              <p>
                Author ID: {author.id}
              </p>
            </div>

            <button
              className="edit-button"
              onClick={() =>
                navigate(`/authors/${author.id}/edit`)
              }
            >
              Edit Author
            </button>

          </div>


          <div className="author-info-grid">

            <div className="author-info-item">
              <span>
                Author ID
              </span>

              <strong>
                {author.id}
              </strong>
            </div>


            <div className="author-info-item">
              <span>
                Author Name
              </span>

              <strong>
                {author.name}
              </strong>
            </div>


            <div className="author-info-item">
              <span>
                Open Library Key
              </span>

              <strong>
                {author.open_library_key || "-"}
              </strong>
            </div>


            <div className="author-info-item">
              <span>
                Total Books
              </span>

              <strong>
                {books.length}
              </strong>
            </div>

          </div>

        </div>
      )}


      {/* BOOKS */}

      <div className="author-books-card">

        <div className="author-books-header">

          <div>
            <h2>
              Books by this Author
            </h2>

            <p>
              {books.length} book
              {books.length !== 1 ? "s" : ""}
            </p>
          </div>

        </div>


        {books.length === 0 ? (

          <div className="no-books">
            No books found for this author.
          </div>

        ) : (

          <div className="author-table-wrapper">

            <table className="author-books-table">

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

                    <td>
                      {book.id}
                    </td>

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

export default AuthorDetails;