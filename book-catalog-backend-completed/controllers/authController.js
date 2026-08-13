import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { generateToken } from "../utils/jwt.js";
import { blacklistToken } from "../utils/tokenBlacklist.js";

// =====================================================
// ADMIN REGISTRATION
// POST /api/auth/register
// =====================================================

export const registerAdmin = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        const trimmedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (!trimmedName) {
            return res.status(400).json({
                success: false,
                message: "Name cannot be empty"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        // Check existing admin
        const [existingAdmin] = await pool.execute(
            `
            SELECT id
            FROM admins
            WHERE email = ?
            LIMIT 1
            `,
            [normalizedEmail]
        );

        if (existingAdmin.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Admin with this email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create admin
        const [result] = await pool.execute(
            `
            INSERT INTO admins
            (
                name,
                email,
                password,
                role,
                status
            )
            VALUES (?, ?, ?, 'admin', 'active')
            `,
            [
                trimmedName,
                normalizedEmail,
                hashedPassword
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Admin registered successfully",
            data: {
                id: result.insertId,
                name: trimmedName,
                email: normalizedEmail,
                role: "admin",
                status: "active"
            }
        });

    } catch (error) {
        next(error);
    }
};


// =====================================================
// ADMIN LOGIN
// POST /api/auth/login
// =====================================================

export const loginAdmin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Find admin
        const [admins] = await pool.execute(
            `
            SELECT
                id,
                name,
                email,
                password,
                role,
                status
            FROM admins
            WHERE email = ?
            LIMIT 1
            `,
            [normalizedEmail]
        );

        if (admins.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const admin = admins[0];

        // Check account status
        if (admin.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Admin account is inactive"
            });
        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            admin.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate JWT
        const token = generateToken(admin);

        // Update last login
        await pool.execute(
            `
            UPDATE admins
            SET last_login_at = NOW()
            WHERE id = ?
            `,
            [admin.id]
        );

        // Remove password from response
        delete admin.password;

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                admin,
                token
            }
        });

    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET CURRENT ADMIN
// GET /api/auth/me
// =====================================================

export const getCurrentAdmin = async (req, res, next) => {
    try {
        return res.status(200).json({
            success: true,
            message: "Current admin retrieved successfully",
            data: {
                admin: req.admin
            }
        });

    } catch (error) {
        next(error);
    }
};

// =====================================================
// ADMIN LOGOUT
// POST /api/auth/logout
// =====================================================

// =====================================================
// ADMIN LOGOUT
// POST /api/auth/logout
// Logout + Deactivate Account
// =====================================================

export const logoutAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Check authorization header
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access token is required"
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token is required"
            });
        }

        // Get logged-in admin from JWT
        const adminId = req.user?.id;
        const decoded = req.user;

        if (!adminId || !decoded?.exp) {
            return res.status(401).json({
                success: false,
                message: "Invalid access token"
            });
        }

        // =====================================================
        // BLACKLIST JWT
        // =====================================================

        const expiresAt = decoded.exp * 1000;

        blacklistToken(token, expiresAt);

        // =====================================================
        // DEACTIVATE ADMIN ACCOUNT
        // =====================================================

        await pool.execute(
            `
            UPDATE admins
            SET status = 'inactive'
            WHERE id = ?
            `,
            [adminId]
        );

        return res.status(200).json({
            success: true,
            message: "Logout successful. Account has been deactivated."
        });

    } catch (error) {
        console.error("LOGOUT ERROR:", error);
        next(error);
    }
};