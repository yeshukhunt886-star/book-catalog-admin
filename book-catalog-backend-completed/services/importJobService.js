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
UPDATE IMPORT JOB PROGRESS
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
            failed_count = ?,
            status = 'running'
        WHERE id = ?
        `,
        [
            Number(summary.processed || 0),
            Number(summary.inserted || 0),
            Number(summary.updated || 0),
            Number(summary.skipped || 0),
            Number(summary.failed || 0),
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

    const processed =
        Number(summary.processed || 0);

    const imported =
        Number(summary.inserted || 0);

    const updated =
        Number(summary.updated || 0);

    const skipped =
        Number(summary.skipped || 0);

    const failed =
        Number(summary.failed || 0);


    /*
    -------------------------------------------------
    DETERMINE FINAL STATUS
    -------------------------------------------------
    */

    let status = "completed";

    if (failed > 0 && processed > failed) {
        status = "partially_completed";
    }

    if (failed > 0 && processed === failed) {
        status = "failed";
    }


    await pool.execute(
        `
        UPDATE import_jobs
        SET
            processed_count = ?,
            imported_count = ?,
            updated_count = ?,
            skipped_count = ?,
            failed_count = ?,
            status = ?,
            completed_at = NOW()
        WHERE id = ?
        `,
        [
            processed,
            imported,
            updated,
            skipped,
            failed,
            status,
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
            error?.message ||
            "Import failed",
            jobId
        ]
    );
};


/*
=====================================================
GET SINGLE IMPORT JOB
=====================================================
*/

export const getImportJob = async (
    jobId
) => {

    const [rows] = await pool.execute(
        `
        SELECT
            ij.id,
            ij.admin_id,
            ij.requested_count,
            ij.processed_count,
            ij.imported_count,
            ij.updated_count,
            ij.skipped_count,
            ij.failed_count,
            ij.status,
            ij.error_message,
            ij.started_at,
            ij.completed_at,
            ij.created_at,
            ij.updated_at
        FROM import_jobs ij
        WHERE ij.id = ?
        LIMIT 1
        `,
        [
            jobId
        ]
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
            ij.id,
            ij.admin_id,
            ij.requested_count,
            ij.processed_count,
            ij.imported_count,
            ij.updated_count,
            ij.skipped_count,
            ij.failed_count,
            ij.status,
            ij.error_message,
            ij.started_at,
            ij.completed_at,
            ij.created_at,
            ij.updated_at
        FROM import_jobs ij
        ORDER BY ij.created_at DESC
        `
    );

    return rows;
};