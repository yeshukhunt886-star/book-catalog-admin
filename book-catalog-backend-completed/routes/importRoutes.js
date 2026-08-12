import express from "express";
import { startBookImport, getImportJobs, getImportJob } from "../controllers/importController.js";
import { authenticateAdmin, requireAdmin, requireAdminOrViewer } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/books", authenticateAdmin, requireAdmin, startBookImport);
router.get("/jobs", authenticateAdmin, requireAdminOrViewer, getImportJobs);
router.get("/jobs/:id", authenticateAdmin, requireAdminOrViewer, getImportJob);

// Requirement-compatible /api/imports endpoints
router.post("/", authenticateAdmin, requireAdmin, startBookImport);
router.get("/", authenticateAdmin, requireAdminOrViewer, getImportJobs);
router.get("/:id", authenticateAdmin, requireAdminOrViewer, getImportJob);

export default router;
