import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = ({
  allowedRoles,
  children,
}) => {
  const location = useLocation();

  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  // =========================================
  // CHECK TOKEN
  // =========================================

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // =========================================
  // READ USER
  // =========================================

  let user = null;

  try {
    user = userData
      ? JSON.parse(userData)
      : null;
  } catch (error) {
    console.error(
      "Invalid user data:",
      error
    );

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // =========================================
  // USER NOT FOUND
  // =========================================

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // =========================================
  // ROLE CHECK
  // =========================================

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  // =========================================
  // RENDER CHILDREN
  // OR NESTED ROUTE
  // =========================================

  return children || <Outlet />;
};

export default ProtectedRoute;