import express from "express";
import {
  saveBulkAttendance,
  getAttendanceByClassAndDate,
  getAttendanceReport,
} from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/bulk", protect, saveBulkAttendance);
router.get("/class/:classId", protect, getAttendanceByClassAndDate);
router.get("/report/:classId", protect, getAttendanceReport);

export default router;
