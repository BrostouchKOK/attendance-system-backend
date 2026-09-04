import express from "express";
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getStudents)
  .post(protect, upload.single("photo"), createStudent);

router
  .route("/:id")
  .get(protect, getStudentById)
  .put(protect, upload.single("photo"), updateStudent)
  .delete(protect, deleteStudent);

export default router;
