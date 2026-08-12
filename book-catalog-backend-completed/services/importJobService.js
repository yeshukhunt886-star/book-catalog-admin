import pool from "../config/db.js";

/*
=====================================================
CREATE IMPORT JOB
=====================================================
*/

export const createImportJob = async ({
    adminId = null,
    requestedCount
}) => {

    const [result] = await pool.execute(
        `
        INSERT INTO import_jobs
        (
            admin_id,
            requested_count,
            processed_count,
            imported_count,
            updated_count,
            skipped_count,
            failed_count,
            status,
            started_at
        )
        VALUES (?, ?, 0, 0, 0, 0, 0, 'running', NOW())
        `,
        [
            adminId,
            requestedCount
        ]
    );

    return result.insertId;
};


/*
=====================================================
UPDATE IMPORT JOB
=====================================================
*/

export const updateImportJob = async (
    jobId,
    summary
) => {

    await pool.execute(
        `
        UPDATE import_jobs
        SET
            processed_count = ?,
            imported_count = ?,
            updated_count = ?,
            skipped_count = ?,
            failed_count = ?
        WHERE id = ?
        `,
        [
            summary.processed || 0,
            summary.inserted || 0,
            summary.updated || 0,
            summary.skipped || 0,
            summary.failed || 0,
            jobId
        ]
    );
};


/*
=====================================================
COMPLETE IMPORT JOB
=====================================================
*/

export const completeImportJob = async (
    jobId,
    summary
) => {

    await pool.execute(
        `
        UPDATE import_jobs
        SET
            processed_count = ?,
            imported_count = ?,
            updated_count = ?,
            skipped_count = ?,
            failed_count = ?,
            status = 'completed',
            completed_at = NOW()
        WHERE id = ?
        `,
        [
            summary.processed || 0,
            summary.inserted || 0,
            summary.updated || 0,
            summary.skipped || 0,
            summary.failed || 0,
            jobId
        ]
    );
};


/*
=====================================================
FAIL IMPORT JOB
=====================================================
*/

export const failImportJob = async (
    jobId,
    error
) => {

    await pool.execute(
        `
        UPDATE import_jobs
        SET
            status = 'failed',
            error_message = ?,
            completed_at = NOW()
        WHERE id = ?
        `,
        [
            error?.message || "Import failed",
            jobId
        ]
    );
};


/*
=====================================================
GET IMPORT JOB
=====================================================
*/

export const getImportJob = async (
    jobId
) => {

    const [rows] = await pool.execute(
        `
        SELECT *
        FROM import_jobs
        WHERE id = ?
        LIMIT 1
        `,
        [jobId]
    );

    return rows[0] || null;
};


/*
=====================================================
GET ALL IMPORT JOBS
=====================================================
*/

export const getImportJobs = async () => {

    const [rows] = await pool.execute(
        `
        SELECT
            ij.*,
            a.email AS admin_email
        FROM import_jobs ij
        LEFT JOIN admins a
            ON a.id = ij.admin_id
        ORDER BY ij.created_at DESC
        `
    );

    return rows;
};