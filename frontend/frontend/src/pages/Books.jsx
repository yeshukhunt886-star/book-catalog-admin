
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
  const [error, setError] = useState("");

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

  useEffect(() => {
    fetchBooks();
  }, [page, sort, order]);

  const handleSearch = (e) => {
    e.preventDefault();

    setPage(1);

    setTimeout(() => {
      fetchBooks();
    }, 0);
  };

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

    setTimeout(() => {
      fetchBooks();
    }, 0);
  };

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

  const handleEdit = (id) => {
    navigate(`/books/${id}/edit`);
  };

  const handleCreate = () => {
    navigate("/books/create");
  };
  

  return (
    <div className="books-layout">
      <Sidebar />

      <main className="books-main">

        {/* HEADER */}
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
            >
              Refresh
            </button>
          </div>
        </div>

        {/* SEARCH AND FILTERS */}
        <form
          className="books-filter-card"
          onSubmit={handleSearch}
        >

          <div className="filter-group search-group">
            <label>Search</label>

            <input
              type="text"
              placeholder="Search title, author, ISBN..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          <div className="filter-group">
            <label>Subject</label>

            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) =>
                setSubject(e.target.value)
              }
            />
          </div>

          <div className="filter-group">
            <label>Author</label>

            <input
              type="text"
              placeholder="Author"
              value={author}
              onChange={(e) =>
                setAuthor(e.target.value)
              }
            />
          </div>

          <div className="filter-group">
            <label>Language</label>

            <input
              type="text"
              placeholder="e.g. eng"
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value)
              }
            />
          </div>

          <div className="filter-group">
            <label>Min Year</label>

            <input
              type="number"
              placeholder="From"
              value={minYear}
              onChange={(e) =>
                setMinYear(e.target.value)
              }
            />
          </div>

          <div className="filter-group">
            <label>Max Year</label>

            <input
              type="number"
              placeholder="To"
              value={maxYear}
              onChange={(e) =>
                setMaxYear(e.target.value)
              }
            />
          </div>

          <div className="filter-group">
            <label>Quality</label>

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

          <div className="filter-group">
            <label>Sort By</label>

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

          <div className="filter-group">
            <label>Order</label>

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

        {/* ERROR */}
        {error && (
          <div className="books-error">
            {error}
          </div>
        )}

        {/* BOOK TABLE */}
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
                  <th>ID</th>
                  <th>Title</th>
                  <th>ISBN</th>
                  <th>Publisher</th>
                  <th>Year</th>
                  <th>Language</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

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

                  <tr>
                    <td
                      colSpan="7"
                      className="table-message"
                    >
                      No books found.
                    </td>
                  </tr>

                ) : (

                  books.map((book) => (

                    <tr key={book.id}>

                      <td>
                        {book.id}
                      </td>

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

                      <td>
                        {book.language || "-"}
                      </td>

                      <td>

                        <button
                          className="edit-button"
                          onClick={() =>
                            handleEdit(book.id)
                          }
                        >
                          Edit
                        </button>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

          {/* PAGINATION */}
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
              Page {pagination.page || page}
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
