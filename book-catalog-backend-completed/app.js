import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import openLibraryRoutes from "./routes/openLibraryRoutes.js";
import importRoutes from "./routes/importRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import authorRoutes from "./routes/authorRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import dataQualityRoutes from "./routes/dataQualityRoutes.js";
import importJobRoutes from "./routes/importJobRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";


import { notFoundMiddleware } from "./middleware/notFoundMiddleware.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

//CORS
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true
    })
);


// BODY PARSER
app.use(express.json());
app.use(
    express.urlencoded({
        extended: true
    })
);


// API ROUTES
app.use("/api/health", healthRoutes);
app.use("/api/auth",authRoutes);
app.use("/api/open-library",openLibraryRoutes);
app.use("/api/import", importRoutes);
app.use("/api/imports", importRoutes);
app.use("/api/books",bookRoutes);
app.use("/api/authors",authorRoutes);
app.use("/api/subjects",subjectRoutes);
app.use("/api/reports",reportRoutes);
app.use("/api/exports", exportRoutes);
app.use("/api/data-quality",dataQualityRoutes);
app.use("/api/import-jobs",importJobRoutes);
app.use(
    "/api/audit-logs",
    auditLogRoutes
);




// ROOT ROUTE
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to Book Catalog Data Import Admin Portal API",
        version: "1.0.0"
    });
});

// 404 HANDLER
app.use(notFoundMiddleware);


// GLOBAL ERROR HANDLER

app.use(errorMiddleware);

export default app;