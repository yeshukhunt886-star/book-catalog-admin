import bcrypt from "bcryptjs";

import pool from "../config/db.js";

import { generateToken } from "../utils/jwt.js";


// ADMIN REGISTRATION

export const registerAdmin = async (
    req,
    res,
    next
) => {
    try {
        const {
            name,
            email,
            password
        } = req.body;

        // Validation
        if (
            !name ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email and password are required"
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters"
            });
        }

        // Check Existing Admin
        const [existingAdmin] =
            await pool.execute(
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
                message:
                    "Admin with this email already exists"
            });
        }

        // Hash Password
        const hashedPassword =
            await bcrypt.hash(
                password,
                12
            );

        // Create Admin
        const [result] =
            await pool.execute(
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
                    name.trim(),
                    normalizedEmail,
                    hashedPassword
                ]
            );


        res.status(201).json({
            success: true,
            message:
                "Admin registered successfully",
            data: {
                id: result.insertId,
                name: name.trim(),
                email: normalizedEmail,
                role: "admin"
            }
        });
    } catch (error) {
        next(error);
    }
};



// ADMIN LOGIN
export const loginAdmin = async (
    req,
    res,
    next
) => {
    try {
        const {
            email,
            password
        } = req.body;

        // validation

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required"
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        // Find Admin
        const [admins] =
            await pool.execute(
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
                message:
                    "Invalid email or password"
            });
        }

        const admin = admins[0];

        // Check Account Status
        if (admin.status !== "active") {
            return res.status(403).json({
                success: false,
                message:
                    "Admin account is inactive"
            });
        }

        // Compare Password
        const passwordMatch =
            await bcrypt.compare(
                password,
                admin.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });
        }

        // Generate JWT
        const token =
            generateToken(admin);

        // Update Last Login
        await pool.execute(
            `
            UPDATE admins
            SET last_login_at = NOW()
            WHERE id = ?
            `,
            [admin.id]
        );

        // Remove Password

        delete admin.password;

        // Response
        res.status(200).json({
            success: true,
            message:
                "Login successful",

            data: {
                admin,
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

/*
=====================================================
GET CURRENT ADMIN
=====================================================
*/

export const getCurrentAdmin = async (
    req,
    res,
    next
) => {
    try {
        res.status(200).json({
            success: true,
            message:
                "Current admin retrieved successfully",

            data: {
                admin: req.admin
            }
        });
    } catch (error) {
        next(error);
    }
};