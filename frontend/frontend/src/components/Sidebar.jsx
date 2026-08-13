import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role;

  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/login");
    }
  };

  return (
    <aside className="sidebar">

      {/* Logo */}
      <div className="sidebar-logo">
        <h2>Book Catalog</h2>
        <span>Admin Portal</span>
      </div>

      {/* Navigation */}
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

      {/* Footer */}
      <div className="sidebar-footer">

        {/* User Information */}
        <div className="user-info">
          <div className="user-avatar">
            {user?.email?.charAt(0).toUpperCase() || "A"}
          </div>

          <div className="user-details">
            <strong>{user?.email || "Admin"}</strong>
            <small>{role || "admin"}</small>
          </div>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>

      </div>
    </aside>
  );
}

export default Sidebar;