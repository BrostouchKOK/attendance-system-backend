import express from "express";
import {
  getClasses,
  createClass,
  updateClass,
  cloneClassesForNewYear,
  getAcademicYears,
} from "../controllers/classController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import Class from "../models/Class.js";

const router = express.Router();

router.get("/academic-years", protect, getAcademicYears);
router
  .route("/")
  .get(protect, getClasses)
  .post(protect, adminOnly, createClass);

// Route សម្រាប់ Clone/ចម្លងថ្នាក់រៀនទាំងអស់ទៅឆ្នាំសិក្សាថ្មី
router.post("/clone", protect, adminOnly, cloneClassesForNewYear);

// Route សម្រាប់រាប់ចំនួនថ្នាក់ (មាន Filter តាម academicYear បើសិនជាមានផ្ញើមក)
router.get("/count", protect, async (req, res) => {
  try {
    const { academicYear } = req.query;
    const filter = academicYear ? { academicYear } : {};

    const count = await Class.countDocuments(filter);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "មិនអាចរាប់ចំនួនថ្នាក់បានទេ" });
  }
});

router.route("/:id").put(protect, adminOnly, updateClass);

export default router;
