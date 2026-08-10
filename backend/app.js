import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";

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