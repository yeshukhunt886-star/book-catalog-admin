import pool from "../config/db.js";
import { importBooks, validateImportSize } from "../services/importService.js";

// POST /api/imports
// POST /api/imports
export const startBookImport = async (req, res, next) => {
    try {
        const {
            keyword = "",
            subject = "",
            count,
            limit
        } = req.body || {};

        const cleanKeyword =
            typeof keyword === "string"
                ? keyword.trim()
                : "";

        const cleanSubject =
            typeof subject === "string"
                ? subject.trim()
                : "";

        // Empty search validation
        if (!cleanKeyword && !cleanSubject) {
            return res.status(400).json({
                success: false,
                message: "Keyword or subject is required"
            });
        }

        // Minimum keyword length validation
        if (cleanKeyword && cleanKeyword.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Keyword must contain at least 2 characters"
            });
        }

        const importCount =
            validateImportSize(count ?? limit);

        const adminId =
            req.user?.id ||
            req.admin?.id ||
            null;

        const result = await importBooks(
            importCount,
            adminId,
            {
                keyword: cleanKeyword,
                subject: cleanSubject
            }
        );

        return res.status(201).json({
            success: true,
            message:
                result.failed > 0 ||
                result.skipped > 0
                    ? "Import completed with some errors"
                    : "Import completed successfully",
            data: {
                jobId: result.jobId,
                keyword: cleanKeyword || null,
                subject: cleanSubject || null,
                requested: result.requested,
                fetched: result.fetched,
                processed: result.processed,
                inserted: result.inserted,
                updated: result.updated,
                duplicates: result.duplicates,
                skipped: result.skipped,
                failed: result.failed
            }
        });

    } catch (error) {
        next(error);
    }
};

// GET /api/imports
export const getImportJobs = async (req, res, next) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const offset = (page - 1) * limit;

        const [countRows] = await pool.execute("SELECT COUNT(*) AS total FROM import_jobs");
        const total = Number(countRows[0]?.total || 0);

        const [rows] = await pool.execute(`
            SELECT id, admin_id, requested_count, processed_count,
                   imported_count, updated_count, skipped_count, failed_count,
                   status, error_message, started_at, completed_at, created_at, updated_at
            FROM import_jobs
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        return res.json({
            success: true,
            data: rows,
            pagination: { page, limit, total, totalPages: total ? Math.ceil(total / limit) : 0 }
        });
    } catch (error) { next(error); }
};

// GET /api/imports/:id
export const getImportJob = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: "Invalid import job id" });
        }

        const [rows] = await pool.execute(`
            SELECT id, admin_id, requested_count, processed_count,
                   imported_count, updated_count, skipped_count, failed_count,
                   status, error_message, started_at, completed_at, created_at, updated_at
            FROM import_jobs WHERE id = ? LIMIT 1
        `, [id]);

        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Import job not found" });
        }

        let errors = [];
        try {
            const [logRows] = await pool.execute(`
                SELECT id, import_job_id, record_identifier, error_message, created_at
                FROM import_errors
                WHERE import_job_id = ?
                ORDER BY id ASC
            `, [id]);
            errors = logRows;
        } catch (logError) {
            console.warn("Import error table unavailable:", logError.message);
        }

        return res.json({ success: true, data: { ...rows[0], errors } });
    } catch (error) { next(error); }
};
