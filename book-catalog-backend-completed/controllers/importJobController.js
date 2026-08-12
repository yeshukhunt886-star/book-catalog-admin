import pool from "../config/db.js";

/*
=====================================================
STEP 16.1 — IMPORT JOBS & IMPORT LOGS
=====================================================
*/

/*
=====================================================
GET ALL IMPORT JOBS
GET /api/import-jobs
GET /api/import-jobs?status=completed
GET /api/import-jobs?page=1&limit=20
=====================================================
*/

export const getImportJobs = async (req, res, next) => {
    try {
        const {
            status = "",
            page = 1,
            limit = 20
        } = req.query;

        /*
        ---------------------------------------------
        PAGINATION
        ---------------------------------------------
        */

        const currentPage = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const pageLimit = Math.min(
            Math.max(
                parseInt(limit, 10) || 20,
                1
            ),
            100
        );

        const offset =
            (currentPage - 1) * pageLimit;

        /*
        ---------------------------------------------
        STATUS FILTER
        ---------------------------------------------
        */

        const validStatuses = [
            "pending",
            "running",
            "completed",
            "failed",
            "cancelled"
        ];

        const statusValue =
            String(status).trim().toLowerCase();

        let whereClause = "";
        const queryParams = [];

        if (statusValue) {
            if (!validStatuses.includes(statusValue)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid import job status"
                });
            }

            whereClause = `
                WHERE status = ?
            `;

            queryParams.push(statusValue);
        }

        /*
        ---------------------------------------------
        COUNT JOBS
        ---------------------------------------------
        */

        const [countRows] =
            await pool.execute(
                `
                SELECT COUNT(*) AS total
                FROM import_jobs
                ${whereClause}
                `,
                queryParams
            );

        const total =
            Number(countRows[0]?.total || 0);

        /*
        ---------------------------------------------
        GET JOBS
        ---------------------------------------------
        */

        const [jobs] =
            await pool.execute(
                `
                SELECT
                    id,
                    admin_id,
                    requested_count,
                    processed_count,
                    imported_count,
                    updated_count,
                    skipped_count,
                    failed_count,
                    status,
                    error_message,
                    started_at,
                    completed_at,
                    created_at,
                    updated_at
                FROM import_jobs
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                `,
                [
                    ...queryParams,
                    pageLimit,
                    offset
                ]
            );

        /*
        ---------------------------------------------
        PAGINATION
        ---------------------------------------------
        */

        const totalPages =
            Math.ceil(total / pageLimit);

        const hasNextPage =
            currentPage < totalPages;

        const hasPreviousPage =
            currentPage > 1;

        /*
        ---------------------------------------------
        RESPONSE
        ---------------------------------------------
        */

        return res.status(200).json({
            success: true,

            message:
                "Import jobs fetched successfully",

            data: {
                jobs,

                pagination: {
                    page: currentPage,
                    limit: pageLimit,
                    total,
                    totalPages,

                    hasNextPage,
                    hasPreviousPage,

                    nextPage:
                        hasNextPage
                            ? currentPage + 1
                            : null,

                    previousPage:
                        hasPreviousPage
                            ? currentPage - 1
                            : null
                },

                filters: {
                    status:
                        statusValue || null
                }
            }
        });

    } catch (error) {
        console.error(
            "GET IMPORT JOBS ERROR:",
            error
        );

        next(error);
    }
};


/*
=====================================================
GET SINGLE IMPORT JOB
GET /api/import-jobs/:id
=====================================================
*/

export const getImportJobDetails = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        /*
        ---------------------------------------------
        VALIDATE JOB ID
        ---------------------------------------------
        */

        const jobId =
            parseInt(id, 10);

        if (
            !Number.isInteger(jobId) ||
            jobId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid import job ID"
            });
        }

        /*
        ---------------------------------------------
        GET IMPORT JOB
        ---------------------------------------------
        */

        const [jobs] =
            await pool.execute(
                `
                SELECT
                    id,
                    admin_id,
                    requested_count,
                    processed_count,
                    imported_count,
                    updated_count,
                    skipped_count,
                    failed_count,
                    status,
                    error_message,
                    started_at,
                    completed_at,
                    created_at,
                    updated_at
                FROM import_jobs
                WHERE id = ?
                LIMIT 1
                `,
                [jobId]
            );

        /*
        ---------------------------------------------
        JOB NOT FOUND
        ---------------------------------------------
        */

        if (jobs.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Import job not found"
            });
        }

        const job = jobs[0];

        /*
        ---------------------------------------------
        GET LOG COUNT
        ---------------------------------------------
        */

        const [logCountRows] =
            await pool.execute(
                `
                SELECT COUNT(*) AS total
                FROM import_job_logs
                WHERE import_job_id = ?
                `,
                [jobId]
            );

        const totalLogs =
            Number(
                logCountRows[0]?.total || 0
            );

        /*
        ---------------------------------------------
        RESPONSE
        ---------------------------------------------
        */

        return res.status(200).json({
            success: true,

            message:
                "Import job details fetched successfully",

            data: {
                job,

                totalLogs
            }
        });

    } catch (error) {
        console.error(
            "GET IMPORT JOB DETAILS ERROR:",
            error
        );

        next(error);
    }
};


/*
=====================================================
GET IMPORT JOB LOGS
GET /api/import-jobs/:id/logs
GET /api/import-jobs/:id/logs?level=error
GET /api/import-jobs/:id/logs?page=1&limit=20
=====================================================
*/

export const getImportJobLogs = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        const {
            level = "",
            page = 1,
            limit = 20
        } = req.query;

        /*
        ---------------------------------------------
        VALIDATE JOB ID
        ---------------------------------------------
        */

        const jobId =
            parseInt(id, 10);

        if (
            !Number.isInteger(jobId) ||
            jobId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid import job ID"
            });
        }

        /*
        ---------------------------------------------
        CHECK JOB EXISTS
        ---------------------------------------------
        */

        const [jobRows] =
            await pool.execute(
                `
                SELECT id
                FROM import_jobs
                WHERE id = ?
                LIMIT 1
                `,
                [jobId]
            );

        if (jobRows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Import job not found"
            });
        }

        /*
        ---------------------------------------------
        PAGINATION
        ---------------------------------------------
        */

        const currentPage = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const pageLimit = Math.min(
            Math.max(
                parseInt(limit, 10) || 20,
                1
            ),
            100
        );

        const offset =
            (currentPage - 1) * pageLimit;

        /*
        ---------------------------------------------
        LOG LEVEL FILTER
        ---------------------------------------------
        */

        const validLevels = [
            "info",
            "success",
            "warning",
            "error"
        ];

        const levelValue =
            String(level).trim().toLowerCase();

        let whereClause = `
            WHERE import_job_id = ?
        `;

        const queryParams = [jobId];

        if (levelValue) {
            if (!validLevels.includes(levelValue)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid log level"
                });
            }

            whereClause += `
                AND level = ?
            `;

            queryParams.push(levelValue);
        }

        /*
        ---------------------------------------------
        COUNT LOGS
        ---------------------------------------------
        */

        const [countRows] =
            await pool.execute(
                `
                SELECT COUNT(*) AS total
                FROM import_job_logs
                ${whereClause}
                `,
                queryParams
            );

        const total =
            Number(countRows[0]?.total || 0);

        /*
        ---------------------------------------------
        GET LOGS
        ---------------------------------------------
        */

        const [logs] =
            await pool.execute(
                `
                SELECT
                    id,
                    import_job_id,
                    level,
                    message,
                    processed_count,
                    created_at
                FROM import_job_logs
                ${whereClause}
                ORDER BY created_at ASC, id ASC
                LIMIT ? OFFSET ?
                `,
                [
                    ...queryParams,
                    pageLimit,
                    offset
                ]
            );

        /*
        ---------------------------------------------
        PAGINATION
        ---------------------------------------------
        */

        const totalPages =
            Math.ceil(total / pageLimit);

        const hasNextPage =
            currentPage < totalPages;

        const hasPreviousPage =
            currentPage > 1;

        /*
        ---------------------------------------------
        RESPONSE
        ---------------------------------------------
        */

        return res.status(200).json({
            success: true,

            message:
                "Import job logs fetched successfully",

            data: {
                logs,

                importJobId: jobId,

                pagination: {
                    page: currentPage,
                    limit: pageLimit,
                    total,
                    totalPages,

                    hasNextPage,
                    hasPreviousPage,

                    nextPage:
                        hasNextPage
                            ? currentPage + 1
                            : null,

                    previousPage:
                        hasPreviousPage
                            ? currentPage - 1
                            : null
                },

                filters: {
                    level:
                        levelValue || null
                }
            }
        });

    } catch (error) {
        console.error(
            "GET IMPORT JOB LOGS ERROR:",
            error
        );

        next(error);
    }
};


/*
=====================================================
CREATE IMPORT JOB
POST /api/import-jobs
=====================================================
*/

export const createImportJob = async (
    req,
    res,
    next
) => {
    try {
        const {
            requested_count = 0
        } = req.body;

        /*
        ---------------------------------------------
        VALIDATE REQUESTED COUNT
        ---------------------------------------------
        */

        const requestedCount =
            parseInt(requested_count, 10);

        if (
            !Number.isInteger(requestedCount) ||
            requestedCount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "requested_count must be a positive integer"
            });
        }

        /*
        ---------------------------------------------
        GET ADMIN ID
        ---------------------------------------------
        */

        const adminId =
            req.user?.id ||
            req.user?.admin_id ||
            null;

        /*
        ---------------------------------------------
        CREATE JOB
        ---------------------------------------------
        */

        const [result] =
            await pool.execute(
                `
                INSERT INTO import_jobs (
                    admin_id,
                    requested_count,
                    processed_count,
                    imported_count,
                    updated_count,
                    skipped_count,
                    failed_count,
                    status
                )
                VALUES (?, ?, 0, 0, 0, 0, 0, 'pending')
                `,
                [
                    adminId,
                    requestedCount
                ]
            );

        const jobId =
            result.insertId;

        /*
        ---------------------------------------------
        CREATE INITIAL LOG
        ---------------------------------------------
        */

        await pool.execute(
            `
            INSERT INTO import_job_logs (
                import_job_id,
                level,
                message,
                processed_count
            )
            VALUES (?, 'info', ?, 0)
            `,
            [
                jobId,
                `Import job created for ${requestedCount} books`
            ]
        );

        /*
        ---------------------------------------------
        RESPONSE
        ---------------------------------------------
        */

        return res.status(201).json({
            success: true,

            message:
                "Import job created successfully",

            data: {
                jobId,
                requestedCount,
                status: "pending"
            }
        });

    } catch (error) {
        console.error(
            "CREATE IMPORT JOB ERROR:",
            error
        );

        next(error);
    }
};


/*
=====================================================
CREATE IMPORT JOB LOG
POST /api/import-jobs/:id/logs
=====================================================
*/

export const createImportJobLog = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        const {
            level = "info",
            message,
            processed_count = 0
        } = req.body;

        /*
        ---------------------------------------------
        VALIDATE JOB ID
        ---------------------------------------------
        */

        const jobId =
            parseInt(id, 10);

        if (
            !Number.isInteger(jobId) ||
            jobId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid import job ID"
            });
        }

        /*
        ---------------------------------------------
        VALIDATE MESSAGE
        ---------------------------------------------
        */

        if (
            typeof message !== "string" ||
            !message.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Log message is required"
            });
        }

        /*
        ---------------------------------------------
        VALIDATE LEVEL
        ---------------------------------------------
        */

        const validLevels = [
            "info",
            "success",
            "warning",
            "error"
        ];

        const levelValue =
            String(level).trim().toLowerCase();

        if (!validLevels.includes(levelValue)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid log level"
            });
        }

        /*
        ---------------------------------------------
        VALIDATE PROCESSED COUNT
        ---------------------------------------------
        */

        const processedCount =
            parseInt(processed_count, 10);

        if (
            !Number.isInteger(processedCount) ||
            processedCount < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "processed_count must be a non-negative integer"
            });
        }

        /*
        ---------------------------------------------
        CHECK JOB EXISTS
        ---------------------------------------------
        */

        const [jobRows] =
            await pool.execute(
                `
                SELECT id
                FROM import_jobs
                WHERE id = ?
                LIMIT 1
                `,
                [jobId]
            );

        if (jobRows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Import job not found"
            });
        }

        /*
        ---------------------------------------------
        CREATE LOG
        ---------------------------------------------
        */

        const [result] =
            await pool.execute(
                `
                INSERT INTO import_job_logs (
                    import_job_id,
                    level,
                    message,
                    processed_count
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    jobId,
                    levelValue,
                    message.trim(),
                    processedCount
                ]
            );

        /*
        ---------------------------------------------
        RESPONSE
        ---------------------------------------------
        */

        return res.status(201).json({
            success: true,

            message:
                "Import job log created successfully",

            data: {
                logId: result.insertId,
                importJobId: jobId,
                level: levelValue,
                message: message.trim(),
                processedCount
            }
        });

    } catch (error) {
        console.error(
            "CREATE IMPORT JOB LOG ERROR:",
            error
        );

        next(error);
    }
};

// =====================================================
// STEP 16.4 — IMPORT JOB STATISTICS
// GET /api/import-jobs/:id/stats
// =====================================================

export const getImportJobStats = async (req, res, next) => {
    try {
        const { id } = req.params;

        const jobId = parseInt(id, 10);

        if (!Number.isInteger(jobId) || jobId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid import job ID"
            });
        }

        // -------------------------------------------------
        // GET IMPORT JOB
        // -------------------------------------------------

        const [rows] = await pool.execute(
            `
            SELECT
                id,
                requested_count,
                processed_count,
                imported_count,
                updated_count,
                skipped_count,
                failed_count,
                status,
                started_at,
                completed_at
            FROM import_jobs
            WHERE id = ?
            LIMIT 1
            `,
            [jobId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Import job not found"
            });
        }

        const job = rows[0];

        const requestedCount = Number(job.requested_count || 0);
        const processedCount = Number(job.processed_count || 0);
        const importedCount = Number(job.imported_count || 0);
        const updatedCount = Number(job.updated_count || 0);
        const skippedCount = Number(job.skipped_count || 0);
        const failedCount = Number(job.failed_count || 0);

        // -------------------------------------------------
        // CALCULATE STATISTICS
        // -------------------------------------------------

        const progressPercentage =
            requestedCount > 0
                ? Number(
                    Math.min(
                        (processedCount / requestedCount) * 100,
                        100
                    ).toFixed(2)
                )
                : 0;

        const successCount =
            importedCount + updatedCount;

        const successRate =
            processedCount > 0
                ? Number(
                    ((successCount / processedCount) * 100).toFixed(2)
                )
                : 0;

        const failureRate =
            processedCount > 0
                ? Number(
                    ((failedCount / processedCount) * 100).toFixed(2)
                )
                : 0;

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Import job statistics fetched successfully",

            data: {
                jobId: job.id,

                status: job.status,

                counts: {
                    requested: requestedCount,
                    processed: processedCount,
                    imported: importedCount,
                    updated: updatedCount,
                    skipped: skippedCount,
                    failed: failedCount
                },

                statistics: {
                    progressPercentage,
                    successCount,
                    successRate,
                    failureRate
                },

                timing: {
                    startedAt: job.started_at,
                    completedAt: job.completed_at
                }
            }
        });

    } catch (error) {
        console.error(
            "GET IMPORT JOB STATS ERROR:",
            error
        );

        next(error);
    }
};

// =====================================================
// UPDATE IMPORT JOB STATS
// PATCH /api/import-jobs/:id/stats
// =====================================================

export const updateImportJobStats = async (req, res, next) => {
    try {
        const { id } = req.params;

        const jobId = parseInt(id, 10);

        if (!Number.isInteger(jobId) || jobId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid import job ID"
            });
        }

        const {
            processedCount,
            importedCount,
            updatedCount,
            skippedCount,
            failedCount,
            status,
            errorMessage
        } = req.body;

        // -------------------------------------------------
        // VALIDATE NUMBERS
        // -------------------------------------------------

        const fields = {
            processedCount,
            importedCount,
            updatedCount,
            skippedCount,
            failedCount
        };

        for (const [field, value] of Object.entries(fields)) {
            if (
                value !== undefined &&
                (!Number.isInteger(Number(value)) || Number(value) < 0)
            ) {
                return res.status(400).json({
                    success: false,
                    message: `${field} must be a non-negative integer`
                });
            }
        }

        // -------------------------------------------------
        // VALIDATE STATUS
        // -------------------------------------------------

        const allowedStatuses = [
            "pending",
            "running",
            "completed",
            "failed",
            "cancelled"
        ];

        if (
            status !== undefined &&
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid status. Allowed values: pending, running, completed, failed, cancelled"
            });
        }

        // -------------------------------------------------
        // CHECK JOB EXISTS
        // -------------------------------------------------

        const [jobs] = await pool.execute(
            `
            SELECT
                id,
                status
            FROM import_jobs
            WHERE id = ?
            LIMIT 1
            `,
            [jobId]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Import job not found"
            });
        }

        // -------------------------------------------------
        // BUILD UPDATE QUERY
        // -------------------------------------------------

        const updates = [];
        const params = [];

        if (processedCount !== undefined) {
            updates.push("processed_count = ?");
            params.push(Number(processedCount));
        }

        if (importedCount !== undefined) {
            updates.push("imported_count = ?");
            params.push(Number(importedCount));
        }

        if (updatedCount !== undefined) {
            updates.push("updated_count = ?");
            params.push(Number(updatedCount));
        }

        if (skippedCount !== undefined) {
            updates.push("skipped_count = ?");
            params.push(Number(skippedCount));
        }

        if (failedCount !== undefined) {
            updates.push("failed_count = ?");
            params.push(Number(failedCount));
        }

        if (status !== undefined) {
            updates.push("status = ?");
            params.push(status);
        }

        if (errorMessage !== undefined) {
            updates.push("error_message = ?");
            params.push(
                errorMessage === null
                    ? null
                    : String(errorMessage)
            );
        }

        // -------------------------------------------------
        // STATUS TIMESTAMPS
        // -------------------------------------------------

        if (status === "running") {
            updates.push("started_at = COALESCE(started_at, NOW())");
        }

        if (
            status === "completed" ||
            status === "failed" ||
            status === "cancelled"
        ) {
            updates.push(
                "completed_at = COALESCE(completed_at, NOW())"
            );
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields provided for update"
            });
        }

        // -------------------------------------------------
        // UPDATE DATABASE
        // -------------------------------------------------

        params.push(jobId);

        await pool.execute(
            `
            UPDATE import_jobs
            SET ${updates.join(", ")}
            WHERE id = ?
            `,
            params
        );

        // -------------------------------------------------
        // FETCH UPDATED JOB
        // -------------------------------------------------

        const [updatedJobs] = await pool.execute(
            `
            SELECT
                id,
                admin_id,
                requested_count,
                processed_count,
                imported_count,
                updated_count,
                skipped_count,
                failed_count,
                status,
                error_message,
                started_at,
                completed_at,
                created_at,
                updated_at
            FROM import_jobs
            WHERE id = ?
            LIMIT 1
            `,
            [jobId]
        );

        return res.status(200).json({
            success: true,
            message: "Import job stats updated successfully",
            data: {
                job: updatedJobs[0]
            }
        });

    } catch (error) {
        console.error(
            "UPDATE IMPORT JOB STATS ERROR:",
            error
        );

        next(error);
    }
};

// =====================================================
// GET IMPORT JOB STATUS & PROGRESS
// GET /api/import-jobs/:id/progress
// =====================================================

export const getImportJobProgress = async (req, res, next) => {
    try {
        const { id } = req.params;

        const jobId = parseInt(id, 10);

        // -------------------------------------------------
        // VALIDATE ID
        // -------------------------------------------------

        if (!Number.isInteger(jobId) || jobId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid import job ID"
            });
        }

        // -------------------------------------------------
        // GET IMPORT JOB
        // -------------------------------------------------

        const [jobs] = await pool.execute(
            `
            SELECT
                id,
                admin_id,
                requested_count,
                processed_count,
                imported_count,
                updated_count,
                skipped_count,
                failed_count,
                status,
                error_message,
                started_at,
                completed_at,
                created_at,
                updated_at
            FROM import_jobs
            WHERE id = ?
            LIMIT 1
            `,
            [jobId]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Import job not found"
            });
        }

        const job = jobs[0];

        // -------------------------------------------------
        // CALCULATE PROGRESS
        // -------------------------------------------------

        const requestedCount =
            Number(job.requested_count || 0);

        const processedCount =
            Number(job.processed_count || 0);

        let progressPercentage = 0;

        if (requestedCount > 0) {
            progressPercentage =
                Math.min(
                    100,
                    Number(
                        (
                            (processedCount / requestedCount) *
                            100
                        ).toFixed(2)
                    )
                );
        }

        // -------------------------------------------------
        // GET LATEST LOG
        // -------------------------------------------------

        const [logs] = await pool.execute(
            `
            SELECT
                id,
                import_job_id,
                level,
                message,
                processed_count,
                created_at
            FROM import_job_logs
            WHERE import_job_id = ?
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            `,
            [jobId]
        );

        const latestLog =
            logs.length > 0
                ? logs[0]
                : null;

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Import job progress fetched successfully",

            data: {
                job: {
                    id: job.id,
                    admin_id: job.admin_id,

                    requestedCount:
                        requestedCount,

                    processedCount:
                        processedCount,

                    importedCount:
                        Number(
                            job.imported_count || 0
                        ),

                    updatedCount:
                        Number(
                            job.updated_count || 0
                        ),

                    skippedCount:
                        Number(
                            job.skipped_count || 0
                        ),

                    failedCount:
                        Number(
                            job.failed_count || 0
                        ),

                    status:
                        job.status,

                    progressPercentage,

                    errorMessage:
                        job.error_message,

                    startedAt:
                        job.started_at,

                    completedAt:
                        job.completed_at,

                    createdAt:
                        job.created_at,

                    updatedAt:
                        job.updated_at
                },

                latestLog
            }
        });

    } catch (error) {
        console.error(
            "GET IMPORT JOB PROGRESS ERROR:",
            error
        );

        next(error);
    }
};

// =====================================================
// STEP 16.3 — IMPORT HISTORY
// GET /api/import-jobs/history
// =====================================================

export const getImportHistory = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            status = "",
            fromDate = "",
            toDate = ""
        } = req.query;

        // -------------------------------------------------
        // PAGINATION
        // -------------------------------------------------

        const currentPage = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const pageLimit = Math.min(
            Math.max(
                parseInt(limit, 10) || 20,
                1
            ),
            100
        );

        const offset =
            (currentPage - 1) * pageLimit;

        // -------------------------------------------------
        // FILTERS
        // -------------------------------------------------

        const conditions = [];
        const queryParams = [];

        // STATUS FILTER
        if (String(status).trim()) {
            const allowedStatuses = [
                "pending",
                "running",
                "completed",
                "failed",
                "cancelled"
            ];

            const statusValue =
                String(status).trim().toLowerCase();

            if (!allowedStatuses.includes(statusValue)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid status. Allowed values: pending, running, completed, failed, cancelled"
                });
            }

            conditions.push(
                "ij.status = ?"
            );

            queryParams.push(
                statusValue
            );
        }

        // FROM DATE
        if (String(fromDate).trim()) {
            conditions.push(
                "DATE(ij.created_at) >= ?"
            );

            queryParams.push(
                String(fromDate).trim()
            );
        }

        // TO DATE
        if (String(toDate).trim()) {
            conditions.push(
                "DATE(ij.created_at) <= ?"
            );

            queryParams.push(
                String(toDate).trim()
            );
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        // -------------------------------------------------
        // COUNT
        // -------------------------------------------------

        const [countRows] =
            await pool.execute(
                `
                SELECT COUNT(*) AS total
                FROM import_jobs ij
                ${whereClause}
                `,
                queryParams
            );

        const total =
            Number(
                countRows[0]?.total || 0
            );

        // -------------------------------------------------
        // IMPORT HISTORY
        // -------------------------------------------------

        const [jobs] =
            await pool.execute(
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
                ${whereClause}
                ORDER BY ij.created_at DESC
                LIMIT ? OFFSET ?
                `,
                [
                    ...queryParams,
                    pageLimit,
                    offset
                ]
            );

        // -------------------------------------------------
        // FORMAT HISTORY
        // -------------------------------------------------

        const history =
            jobs.map((job) => {
                const requestedCount =
                    Number(
                        job.requested_count || 0
                    );

                const processedCount =
                    Number(
                        job.processed_count || 0
                    );

                let progressPercentage = 0;

                if (requestedCount > 0) {
                    progressPercentage =
                        Math.min(
                            100,
                            Number(
                                (
                                    (
                                        processedCount /
                                        requestedCount
                                    ) * 100
                                ).toFixed(2)
                            )
                        );
                }

                return {
                    id: job.id,

                    adminId:
                        job.admin_id,

                    requestedCount,

                    processedCount,

                    importedCount:
                        Number(
                            job.imported_count || 0
                        ),

                    updatedCount:
                        Number(
                            job.updated_count || 0
                        ),

                    skippedCount:
                        Number(
                            job.skipped_count || 0
                        ),

                    failedCount:
                        Number(
                            job.failed_count || 0
                        ),

                    status:
                        job.status,

                    progressPercentage,

                    errorMessage:
                        job.error_message,

                    startedAt:
                        job.started_at,

                    completedAt:
                        job.completed_at,

                    createdAt:
                        job.created_at,

                    updatedAt:
                        job.updated_at
                };
            });

        // -------------------------------------------------
        // PAGINATION
        // -------------------------------------------------

        const totalPages =
            Math.ceil(
                total / pageLimit
            );

        const hasNextPage =
            currentPage < totalPages;

        const hasPreviousPage =
            currentPage > 1;

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Import history fetched successfully",

            data: {
                history,

                pagination: {
                    page: currentPage,
                    limit: pageLimit,
                    total,
                    totalPages,

                    hasNextPage,

                    hasPreviousPage,

                    nextPage:
                        hasNextPage
                            ? currentPage + 1
                            : null,

                    previousPage:
                        hasPreviousPage
                            ? currentPage - 1
                            : null
                },

                filters: {
                    status:
                        String(status).trim() || null,

                    fromDate:
                        String(fromDate).trim() || null,

                    toDate:
                        String(toDate).trim() || null
                }
            }
        });

    } catch (error) {
        console.error(
            "GET IMPORT HISTORY ERROR:",
            error
        );

        next(error);
    }
};

// =====================================================
// STEP 16.4 — CANCEL IMPORT JOB
// PATCH /api/import-jobs/:id/cancel
// =====================================================

export const cancelImportJob = async (req, res, next) => {
    try {
        const { id } = req.params;

        const jobId = parseInt(id, 10);

        if (!Number.isInteger(jobId) || jobId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid import job ID"
            });
        }

        // -------------------------------------------------
        // GET IMPORT JOB
        // -------------------------------------------------

        const [jobs] = await pool.execute(
            `
            SELECT
                id,
                status
            FROM import_jobs
            WHERE id = ?
            LIMIT 1
            `,
            [jobId]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Import job not found"
            });
        }

        const job = jobs[0];

        // -------------------------------------------------
        // CHECK STATUS
        // -------------------------------------------------

        if (
            job.status !== "pending" &&
            job.status !== "running"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Import job cannot be cancelled because its current status is '${job.status}'`
            });
        }

        // -------------------------------------------------
        // CANCEL JOB
        // -------------------------------------------------

        await pool.execute(
            `
            UPDATE import_jobs
            SET
                status = 'cancelled',
                completed_at = NOW()
            WHERE id = ?
            `,
            [jobId]
        );

        // -------------------------------------------------
        // CREATE LOG
        // -------------------------------------------------

        await pool.execute(
            `
            INSERT INTO import_job_logs
            (
                import_job_id,
                level,
                message,
                processed_count
            )
            VALUES (?, 'warning', ?, 0)
            `,
            [
                jobId,
                "Import job cancelled"
            ]
        );

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Import job cancelled successfully",
            data: {
                jobId,
                status: "cancelled"
            }
        });

    } catch (error) {
        console.error(
            "CANCEL IMPORT JOB ERROR:",
            error
        );

        next(error);
    }
};