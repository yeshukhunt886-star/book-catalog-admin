import pool from "../config/db.js";

/*
=====================================================
GET AUDIT LOGS

GET /api/audit-logs

Query parameters:
- page
- limit
- action
- module
- search
=====================================================
*/

export const getAuditLogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            action = "",
            module = "",
            search = ""
        } = req.query;

        const currentPage = Math.max(
            Number(page) || 1,
            1
        );

        const perPage = Math.min(
            Math.max(Number(limit) || 20, 1),
            100
        );

        const offset =
            (currentPage - 1) * perPage;

        const conditions = [];
        const params = [];

        /*
        =============================================
        ACTION FILTER
        =============================================
        */

        if (action.trim()) {
            conditions.push(`
                al.action LIKE ?
            `);

            params.push(
                `%${action.trim()}%`
            );
        }

        /*
        =============================================
        MODULE FILTER
        =============================================
        */

        if (module.trim()) {
            conditions.push(`
                al.module LIKE ?
            `);

            params.push(
                `%${module.trim()}%`
            );
        }

        /*
        =============================================
        SEARCH
        =============================================
        */

        if (search.trim()) {
            conditions.push(`
                (
                    al.action LIKE ?
                    OR al.module LIKE ?
                    OR al.description LIKE ?
                    OR al.entity_type LIKE ?
                )
            `);

            const searchValue =
                `%${search.trim()}%`;

            params.push(
                searchValue,
                searchValue,
                searchValue,
                searchValue
            );
        }

        /*
        =============================================
        WHERE CLAUSE
        =============================================
        */

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        /*
        =============================================
        TOTAL COUNT
        =============================================
        */

        const [countRows] =
            await pool.execute(
                `
                SELECT
                    COUNT(*) AS total
                FROM audit_logs al
                ${whereClause}
                `,
                params
            );

        const total =
            Number(
                countRows[0]?.total || 0
            );

        /*
        =============================================
        GET AUDIT LOGS
        =============================================
        */

        const [rows] =
            await pool.execute(
                `
                SELECT
                    al.id,
                    al.admin_id,
                    al.action,
                    al.module,
                    al.record_id,
                    al.performed_at,
                    al.entity_type,
                    al.entity_id,
                    al.description,
                    al.ip_address,
                    al.created_at
                FROM audit_logs al

                ${whereClause}

                ORDER BY
                    al.id DESC

                LIMIT ? OFFSET ?
                `,
                [
                    ...params,
                    perPage,
                    offset
                ]
            );

        /*
        =============================================
        FORMAT DATA
        =============================================
        */

        const logs =
            rows.map((row) => ({
                id: Number(row.id),

                adminId:
                    row.admin_id !== null
                        ? Number(row.admin_id)
                        : null,

                action:
                    row.action || null,

                module:
                    row.module || null,

                recordId:
                    row.record_id !== null
                        ? Number(row.record_id)
                        : null,

                performedAt:
                    row.performed_at || null,

                entityType:
                    row.entity_type || null,

                entityId:
                    row.entity_id !== null
                        ? Number(row.entity_id)
                        : null,

                description:
                    row.description || null,

                ipAddress:
                    row.ip_address || null,

                createdAt:
                    row.created_at || null
            }));

        /*
        =============================================
        PAGINATION
        =============================================
        */

        const totalPages =
            Math.ceil(total / perPage);

        /*
        =============================================
        RESPONSE
        =============================================
        */

        return res.status(200).json({
            success: true,

            message:
                "Audit logs fetched successfully",

            data: {
                logs,

                pagination: {
                    page: currentPage,
                    limit: perPage,
                    total,
                    totalPages,

                    hasNextPage:
                        currentPage < totalPages,

                    hasPreviousPage:
                        currentPage > 1
                },

                filters: {
                    action:
                        action.trim(),

                    module:
                        module.trim(),

                    search:
                        search.trim()
                }
            }
        });

    } catch (error) {

        console.error(
            "GET AUDIT LOGS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to fetch audit logs",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined
        });
    }
};