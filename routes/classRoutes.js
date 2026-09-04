import express from "express";
import { getClasses, createClass } from "../controllers/classController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getClasses)
  .post(protect, adminOnly, createClass);

export default router;
