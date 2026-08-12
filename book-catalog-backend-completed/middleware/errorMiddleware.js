export const errorMiddleware = (
    err,
    req,
    res,
    next
) => {
    console.error("ERROR");
    console.error(err);
   
    // MYSQL ERRORS
    if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            success: false,
            message: "Duplicate record already exists",
            errorCode: err.code
        });
    }

    if (err.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
            success: false,
            message:
                "Referenced record does not exist",
            errorCode: err.code
        });
    }

    if (err.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
            success: false,
            message:
                "Record cannot be deleted because it is being used",
            errorCode: err.code
        });
    }

    if (
        err.code === "ECONNREFUSED" ||
        err.code === "PROTOCOL_CONNECTION_LOST"
    ) {
        return res.status(503).json({
            success: false,
            message: "Database connection unavailable",
            errorCode: err.code
        });
    }

   
    // CUSTOM APPLICATION ERROR

    const statusCode =
        err.statusCode || 500;

    res.status(statusCode).json({
        success: false,

        message:
            err.message ||
            "Internal Server Error",

        ...(process.env.NODE_ENV === "development" && {
            stack: err.stack
        })
    });
};