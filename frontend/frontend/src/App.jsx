import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import CreateBook from "./pages/CreateBook";
import EditBook from "./pages/EditBook";
import Authors from "./pages/Authors";
import AuthorDetails from "./pages/AuthorDetails";
import EditAuthor from "./pages/EditAuthor";
import Subjects from "./pages/Subjects";
import SubjectDetails from "./pages/SubjectDetails";
import EditSubject from "./pages/EditSubject";
import ImportBooks from "./pages/ImportBooks";
import ImportJobs from "./pages/ImportJobs";
import ImportJobDetails from "./pages/ImportJobDetails";
import ImportHistory from "./pages/ImportHistory";
import DataQuality from "./pages/DataQuality";
import Reports from "./pages/Reports";
import AuditLogs from "./pages/AuditLogs";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/books"
            element={
              <ProtectedRoute>
                <Layout>
                  <Books />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/books/create"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout>
                  <CreateBook />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/books/edit/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout>
                  <EditBook />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/authors"
            element={
              <ProtectedRoute>
                <Layout>
                  <Authors />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/authors/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <AuthorDetails />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/subjects"
            element={
              <ProtectedRoute>
                <Layout>
                  <Subjects />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/subjects/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <SubjectDetails />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/import-books"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout>
                  <ImportBooks />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/import-jobs"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout>
                  <ImportJobs />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/import-jobs/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout>
                  <ImportJobDetails />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/import-history"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout>
                  <ImportHistory />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/data-quality"
            element={
              <ProtectedRoute>
                <Layout>
                  <DataQuality />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout>
                  <AuditLogs />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;