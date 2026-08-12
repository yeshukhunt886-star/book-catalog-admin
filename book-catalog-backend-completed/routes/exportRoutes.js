import express from "express";
import { exportBooksCSV } from "../controllers/reportController.js";
import { authenticateAdmin, requireAdminOrViewer } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/books.csv", authenticateAdmin, requireAdminOrViewer, exportBooksCSV);

export default router;
