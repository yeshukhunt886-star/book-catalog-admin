import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./Books.css";

function Books() {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);

  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [author, setAuthor] = useState("");
  const [language, setLanguage] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [quality, setQuality] = useState("");

  const [sort, setSort] = useState("recently_imported");
  const [order, setOrder] = useState("desc");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD BOOKS
  // =====================================================

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit,
        sort,
        order,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (subject.trim()) {
        params.subject = subject.trim();
      }

      if (author.trim()) {
        params.author = author.trim();
      }

      if (language.trim()) {
        params.language = language.trim();
      }

      if (minYear) {
        params.minYear = minYear;
      }

      if (maxYear) {
        params.maxYear = maxYear;
      }

      if (quality) {
        params.quality = quality;
      }

      const response = await api.get("/books", {
        params,
      });

      console.log("BOOKS RESPONSE:", response.data);

      const data = response.data?.data || {};

      setBooks(data.books || []);

      setPagination(
        data.pagination || {
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );
    } catch (err) {
      console.error("BOOKS ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load books"
      );

      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchBooks();
  }, [page, sort, order]);

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = (e) => {
    e.preventDefault();

    setPage(1);
    setSuccess("");
    setError("");

    setTimeout(() => {
      fetchBooks();
    }, 0);
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const handleClear = () => {
    setSearch("");
    setSubject("");
    setAuthor("");
    setLanguage("");
    setMinYear("");
    setMaxYear("");
    setQuality("");

    setSort("recently_imported");
    setOrder("desc");
    setPage(1);

    setSuccess("");
    setError("");

    setTimeout(() => {
      fetchBooks();
    }, 0);
  };

  // =====================================================
  // CREATE BOOK
  // =====================================================

  const handleCreate = () => {
    navigate("/books/create");
  };

  // =====================================================
  // EDIT BOOK
  // =====================================================

  const handleEdit = (id) => {
    setError("");
    setSuccess("");

    navigate(`/books/${id}/edit`);
  };

  // =====================================================
  // DELETE BOOK
  // =====================================================

  const handleDelete = async (id, title) => {
    const bookTitle = title || "this book";

    const confirmed = window.confirm(
      `Are you sure you want to delete "${bookTitle}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoading(id);
      setError("");
      setSuccess("");

      const response = await api.delete(
        `/books/${id}`
      );

      console.log(
        "DELETE BOOK RESPONSE:",
        response.data
      );

      setSuccess(
        response.data?.message ||
          "Book deleted successfully"
      );

      // Reload books after delete
      await fetchBooks();

    } catch (err) {
      console.error(
        "DELETE BOOK ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete book"
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  // =====================================================
  // PAGINATION
  // =====================================================

  const handlePrevious = () => {
    if (pagination.hasPreviousPage) {
      setPage((current) => current - 1);
    }
  };

  const handleNext = () => {
    if (pagination.hasNextPage) {
      setPage((current) => current + 1);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="books-layout">

      <Sidebar />

      <main className="books-main">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="books-header">

          <div>
            <h1>Books</h1>

            <p>
              Manage books in the catalog.
            </p>
          </div>

          <div className="books-header-actions">

            <button
              className="create-button"
              onClick={handleCreate}
            >
              + Create Book
            </button>

            <button
              className="refresh-button"
              onClick={fetchBooks}
              disabled={loading}
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>

          </div>

        </div>


        {/* =====================================================
            SUCCESS MESSAGE
        ===================================================== */}

        {success && (
          <div className="books-success">
            {success}
          </div>
        )}


        {/* =====================================================
            ERROR MESSAGE
        ===================================================== */}

        {error && (
          <div className="books-error">
            {error}
          </div>
        )}


        {/* =====================================================
            SEARCH AND FILTERS
        ===================================================== */}

        <form
          className="books-filter-card"
          onSubmit={handleSearch}
        >

          {/* SEARCH */}

          <div className="filter-group search-group">

            <label>
              Search
            </label>

            <input
              type="text"
              placeholder="Search title, author, ISBN..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>


          {/* SUBJECT */}

          <div className="filter-group">

            <label>
              Subject
            </label>

            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) =>
                setSubject(e.target.value)
              }
            />

          </div>


          {/* AUTHOR */}

          <div className="filter-group">

            <label>
              Author
            </label>

            <input
              type="text"
              placeholder="Author"
              value={author}
              onChange={(e) =>
                setAuthor(e.target.value)
              }
            />

          </div>


          {/* LANGUAGE */}

          <div className="filter-group">

            <label>
              Language
            </label>

            <input
              type="text"
              placeholder="e.g. eng"
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value)
              }
            />

          </div>


          {/* MIN YEAR */}

          <div className="filter-group">

            <label>
              Min Year
            </label>

            <input
              type="number"
              placeholder="From"
              value={minYear}
              onChange={(e) =>
                setMinYear(e.target.value)
              }
            />

          </div>


          {/* MAX YEAR */}

          <div className="filter-group">

            <label>
              Max Year
            </label>

            <input
              type="number"
              placeholder="To"
              value={maxYear}
              onChange={(e) =>
                setMaxYear(e.target.value)
              }
            />

          </div>


          {/* QUALITY */}

          <div className="filter-group">

            <label>
              Quality
            </label>

            <select
              value={quality}
              onChange={(e) =>
                setQuality(e.target.value)
              }
            >

              <option value="">
                All Quality
              </option>

              <option value="high">
                High
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="low">
                Low
              </option>

            </select>

          </div>


          {/* SORT */}

          <div className="filter-group">

            <label>
              Sort By
            </label>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >

              <option value="recently_imported">
                Recently Imported
              </option>

              <option value="recently_updated">
                Recently Updated
              </option>

              <option value="title">
                Title
              </option>

              <option value="publish_year">
                Publish Year
              </option>

            </select>

          </div>


          {/* ORDER */}

          <div className="filter-group">

            <label>
              Order
            </label>

            <select
              value={order}
              onChange={(e) => {
                setOrder(e.target.value);
                setPage(1);
              }}
            >

              <option value="desc">
                Descending
              </option>

              <option value="asc">
                Ascending
              </option>

            </select>

          </div>


          {/* ACTIONS */}

          <div className="filter-actions">

            <button
              type="submit"
              className="search-button"
            >
              Search
            </button>

            <button
              type="button"
              className="clear-button"
              onClick={handleClear}
            >
              Clear
            </button>

          </div>

        </form>


        {/* =====================================================
            BOOK TABLE
        ===================================================== */}

        <div className="books-card">

          <div className="books-card-header">

            <div>

              <strong>
                Books
              </strong>

              <span>
                {pagination.total || 0} total
              </span>

            </div>

          </div>


          <div className="books-table-wrapper">

            <table className="books-table">

              <thead>

                <tr>

                  <th>
                    ID
                  </th>

                  <th>
                    Title
                  </th>

                  <th>
                    ISBN
                  </th>

                  <th>
                    Publisher
                  </th>

                  <th>
                    Year
                  </th>

                  <th>
                    Language
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {/* LOADING */}

                {loading ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="table-message"
                    >
                      Loading books...
                    </td>

                  </tr>

                ) : books.length === 0 ? (

                  /* EMPTY */

                  <tr>

                    <td
                      colSpan="7"
                      className="table-message"
                    >
                      No books found.
                    </td>

                  </tr>

                ) : (

                  /* BOOKS */

                  books.map((book) => (

                    <tr key={book.id}>

                      {/* ID */}

                      <td>
                        {book.id}
                      </td>


                      {/* TITLE */}

                      <td className="book-title">

                        <strong>
                          {book.title || "-"}
                        </strong>

                        {book.subtitle && (
                          <small>
                            {book.subtitle}
                          </small>
                        )}

                      </td>


                      {/* ISBN */}

                      <td>
                        {book.isbn13 ||
                          book.isbn10 ||
                          "-"}
                      </td>


                      {/* PUBLISHER */}

                      <td>
                        {book.publisher || "-"}
                      </td>


                      {/* YEAR */}

                      <td>
                        {book.first_publish_year ||
                          book.publishYear ||
                          "-"}
                      </td>


                      {/* LANGUAGE */}

                      <td>
                        {book.language || "-"}
                      </td>


                      {/* ACTION */}

                      <td>

                        <div className="book-action-buttons">

                          {/* EDIT */}

                          <button
                            type="button"
                            className="edit-button"
                            onClick={() =>
                              handleEdit(book.id)
                            }
                          >
                            Edit
                          </button>


                          {/* DELETE */}

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() =>
                              handleDelete(
                                book.id,
                                book.title
                              )
                            }
                            disabled={
                              deleteLoading ===
                              book.id
                            }
                          >
                            {deleteLoading ===
                            book.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>


          {/* =====================================================
              PAGINATION
          ===================================================== */}

          <div className="pagination">

            <button
              onClick={handlePrevious}
              disabled={
                !pagination.hasPreviousPage ||
                loading
              }
            >
              Previous
            </button>


            <span>

              Page{" "}
              {pagination.page || page}
              {" "}
              of{" "}
              {pagination.totalPages || 0}

            </span>


            <button
              onClick={handleNext}
              disabled={
                !pagination.hasNextPage ||
                loading
              }
            >
              Next
            </button>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Books;