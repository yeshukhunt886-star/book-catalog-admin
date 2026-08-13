import React from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Books from "./pages/Books";
import CreateBook from "./pages/CreateBook";
import EditBook from "./pages/EditBook";
import Authors from "./pages/Authors";
import Subjects from "./pages/Subjects";
import DataQuality from "./pages/DataQuality";
import AuditLogs from "./pages/AuditLogs";
import ImportJobs from "./pages/ImportJobs";

import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";

import "./App.css";


// =====================================================
// MAIN LAYOUT
// =====================================================

function MainLayout({ children }) {
    return (
        <div className="app-layout">

            <Sidebar />

            <main className="app-content">
                {children}
            </main>

        </div>
    );
}


// =====================================================
// APP
// =====================================================

function App() {
    return (
        <BrowserRouter>

            <Routes>

                {/* =================================================
                    LOGIN
                ================================================= */}

                <Route
                    path="/login"
                    element={<Login />}
                />


                {/* =================================================
                    PROTECTED ROUTES
                ================================================= */}

                <Route
                    element={
                        <ProtectedRoute
                            allowedRoles={["admin", "viewer"]}
                        />
                    }
                >

                    {/* =================================================
                        DASHBOARD
                    ================================================= */}

                    <Route
                        path="/dashboard"
                        element={
                            <MainLayout>
                                <Dashboard />
                            </MainLayout>
                        }
                    />


                    {/* =================================================
                        REPORTS
                    ================================================= */}

                    <Route
                        path="/reports"
                        element={
                            <MainLayout>
                                <Reports />
                            </MainLayout>
                        }
                    />


                    {/* =================================================
                        BOOKS
                    ================================================= */}

                    <Route
                        path="/books"
                        element={
                            <MainLayout>
                                <Books />
                            </MainLayout>
                        }
                    />


                    {/* =================================================
                        CREATE BOOK
                    ================================================= */}

                    <Route
                        path="/books/create"
                        element={
                            <MainLayout>
                                <CreateBook />
                            </MainLayout>
                        }
                    />


                    {/* =================================================
                        EDIT BOOK
                    ================================================= */}

                    <Route
                        path="/books/:id/edit"
                        element={
                            <MainLayout>
                                <EditBook />
                            </MainLayout>
                        }
                    />


                    {/* =================================================
                        AUTHORS
                    ================================================= */}

                    <Route
                        path="/authors"
                        element={
                            <MainLayout>
                                <Authors />
                            </MainLayout>
                        }
                    />


                    {/* =================================================
                        SUBJECTS
                    ================================================= */}

                    <Route
                        path="/subjects"
                        element={
                            <MainLayout>
                                <Subjects />
                            </MainLayout>
                        }
                    />


                    {/* =================================================
                        DATA QUALITY
                    ================================================= */}

                    <Route
                        path="/data-quality"
                        element={
                            <MainLayout>
                                <DataQuality />
                            </MainLayout>
                        }
                    />


                    {/* =================================================
                        IMPORT JOBS
                    ================================================= */}

                    <Route
                        path="/import-jobs"
                        element={
                            <MainLayout>
                                <ImportJobs />
                            </MainLayout>
                        }
                    />


                    {/* =================================================
                        AUDIT LOGS
                    ================================================= */}

                    <Route
                        path="/audit-logs"
                        element={
                            <MainLayout>
                                <AuditLogs />
                            </MainLayout>
                        }
                    />

                </Route>


                {/* =================================================
                    DEFAULT ROUTE
                ================================================= */}

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/dashboard"
                            replace
                        />
                    }
                />


                {/* =================================================
                    UNKNOWN URL
                ================================================= */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/dashboard"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}


export default App;