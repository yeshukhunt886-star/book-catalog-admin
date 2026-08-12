import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

function Sidebar() {
  const { user } = useAuth();

  const role = user?.role;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Book Catalog</h2>
        <span>Admin Portal</span>
      </div>

      <nav className="sidebar-nav">

        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <span className="sidebar-icon">📊</span>
          <span>Dashboard</span>
        </NavLink>

        {/* Books */}
        <NavLink
          to="/books"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <span className="sidebar-icon">📚</span>
          <span>Books</span>
        </NavLink>

        {/* Authors */}
        <NavLink
          to="/authors"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <span className="sidebar-icon">✍️</span>
          <span>Authors</span>
        </NavLink>

        {/* Subjects */}
        <NavLink
          to="/subjects"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <span className="sidebar-icon">🏷️</span>
          <span>Subjects</span>
        </NavLink>

        {/* Import Jobs */}
        {role === "admin" && (
          <NavLink
            to="/import-jobs"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon">⚙️</span>
            <span>Import Jobs</span>
          </NavLink>
        )}

        {/* Data Quality */}
        <NavLink
          to="/data-quality"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <span className="sidebar-icon">✅</span>
          <span>Data Quality</span>
        </NavLink>

        {/* Audit Logs */}
        {role === "admin" && (
          <NavLink
            to="/audit-logs"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon">📝</span>
            <span>Audit Logs</span>
          </NavLink>
        )}

      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.email?.charAt(0).toUpperCase() || "A"}
          </div>

          <div className="user-details">
            <strong>{user?.email || "Admin"}</strong>
            <small>{role || "admin"}</small>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

