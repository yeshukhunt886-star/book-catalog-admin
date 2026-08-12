import jwt from "jsonwebtoken";

// =====================================================
// AUTHENTICATE USER
// =====================================================

export const authenticateAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authorization header is required",
            });
        }

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token is required",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {
        console.error(
            "AUTHENTICATION ERROR:",
            error
        );

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Access token expired",
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid access token",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Authentication failed",
        });
    }
};


// =====================================================
// AUTHORIZE ROLE
// =====================================================

export const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const userRole = req.user.role;

        if (!userRole) {
            return res.status(403).json({
                success: false,
                message: "User role not found",
            });
        }

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to perform this action",
            });
        }

        next();
    };
};


// =====================================================
// ADMIN ONLY
// POST / PATCH / DELETE
// =====================================================

export const requireAdmin =
    authorizeRole("admin");


// =====================================================
// ADMIN + VIEWER
// GET / READ ONLY
// =====================================================

export const requireAdminOrViewer =
    authorizeRole("admin", "viewer");