import express from "express";
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkTransferStudents, // 1. Import Function ថ្មីមកប្រើ
} from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../config/cloudinary.js";
import Student from "../models/Student.js";

const router = express.Router();

// ==========================================
// 1. Specific / Static Routes (ត្រូវដាក់នៅខាងលើគេបង្អស់)
// ==========================================

// Route សម្រាប់រាប់ចំនួនសិស្ស
router.get("/count", protect, async (req, res) => {
  try {
    const count = await Student.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "មិនអាចរាប់ចំនួនសិស្សបានទេ" });
  }
});

// Route សម្រាប់ផ្ទេរសិស្សច្រើននាក់ទៅថ្នាក់ថ្មី ( Bulk Transfer )
router.put("/bulk-transfer", protect, bulkTransferStudents);

// ==========================================
// 2. Base Routes
// ==========================================
router
  .route("/")
  .get(protect, getStudents)
  .post(protect, upload.single("photo"), createStudent);

// ==========================================
// 3. Dynamic Routes (មាន :id - ត្រូវដាក់នៅខាងក្រោមគេបង្អស់)
// ==========================================
router
  .route("/:id")
  .get(protect, getStudentById)
  .put(protect, upload.single("photo"), updateStudent)
  .delete(protect, deleteStudent);

export default router;
