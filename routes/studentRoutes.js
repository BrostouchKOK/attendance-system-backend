import express from "express";
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkTransferStudents,
  getStudentCount,
} from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// ==========================================
// 1. Specific / Static Routes
// ==========================================

// Route សម្រាប់រាប់ចំនួនសិស្ស
router.get("/count", protect, getStudentCount);

// Route សម្រាប់ផ្ទេរសិស្សច្រើននាក់ទៅថ្នាក់ថ្មី (Bulk Transfer)
router.put("/bulk-transfer", protect, bulkTransferStudents);

// ==========================================
// 2. Base Routes
// ==========================================
router
  .route("/")
  .get(protect, getStudents)
  .post(protect, upload.single("photo"), createStudent);

// ==========================================
// 3. Dynamic Routes (មាន :id)
// ==========================================
router
  .route("/:id")
  .get(protect, getStudentById)
  .put(protect, upload.single("photo"), updateStudent)
  .delete(protect, deleteStudent);

export default router;