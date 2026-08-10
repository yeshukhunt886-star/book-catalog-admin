import pool from "../config/db.js";

/*
=====================================================
EXECUTE SELECT / INSERT / UPDATE / DELETE QUERY
=====================================================
*/

export const executeQuery = async (
    query,
    params = []
) => {
    try {
        const [result] = await pool.execute(
            query,
            params
        );

        return result;
    } catch (error) {
        console.error(
            "Database query error:",
            error.message
        );

        throw error;
    }
};

/*
=====================================================
TRANSACTION HELPER
=====================================================
*/

export const executeTransaction = async (
    callback
) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const result = await callback(connection);

        await connection.commit();

        return result;
    } catch (error) {
        await connection.rollback();

        console.error(
            "Transaction failed:",
            error.message
        );

        throw error;
    } finally {
        connection.release();
    }
};