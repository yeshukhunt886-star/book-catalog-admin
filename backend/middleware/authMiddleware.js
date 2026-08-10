import jwt from "jsonwebtoken";

import pool from "../config/db.js";

/*
=====================================================
AUTHENTICATION MIDDLEWARE
=====================================================
*/

export const authenticateAdmin = async (
    req,
    res,
    next
) => {
    try {
        /*
        ---------------------------------------------
        Get Authorization Header
        ---------------------------------------------
        */

        const authHeader =
            req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message:
                    "Authorization token is required"
            });
        }

        /*
        ---------------------------------------------
        Check Bearer Token
        ---------------------------------------------
        */

        if (
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid authorization format"
            });
        }

        /*
        ---------------------------------------------
        Extract Token
        ---------------------------------------------
        */

        const token =
            authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication token is missing"
            });
        }

        /*
        ---------------------------------------------
        Verify JWT
        ---------------------------------------------
        */

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        /*
        ---------------------------------------------
        Find Admin
        ---------------------------------------------
        */

        const [admins] =
            await pool.execute(
                `
                SELECT
                    id,
                    name,
                    email,
                    role,
                    status
                FROM admins
                WHERE id = ?
                LIMIT 1
                `,
                [decoded.id]
            );

        if (admins.length === 0) {
            return res.status(401).json({
                success: false,
                message:
                    "Admin account not found"
            });
        }

        const admin = admins[0];

        /*
        ---------------------------------------------
        Check Admin Status
        ---------------------------------------------
        */

        if (admin.status !== "active") {
            return res.status(403).json({
                success: false,
                message:
                    "Admin account is inactive"
            });
        }

        /*
        ---------------------------------------------
        Attach Admin To Request
        ---------------------------------------------
        */

        req.admin = admin;

        /*
        ---------------------------------------------
        Continue
        ---------------------------------------------
        */

        next();
    } catch (error) {
        /*
        ---------------------------------------------
        JWT Errors
        ---------------------------------------------
        */

        if (
            error.name ===
            "TokenExpiredError"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication token has expired"
            });
        }

        if (
            error.name ===
            "JsonWebTokenError"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid authentication token"
            });
        }

        next(error);
    }
};