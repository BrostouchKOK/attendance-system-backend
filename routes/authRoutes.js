import express from "express";
import {
  registerUser,
  loginUser,
  getUsers,
  updateUser,
  toggleUserStatus,
  deleteUser,
} from "../controllers/authController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public Routes
router.post("/login", loginUser);

// Admin Only Routes
router.post("/register", protect, adminOnly, registerUser);
router.get("/users", protect, getUsers);
router.put("/users/:id", protect, adminOnly, updateUser);
router.patch("/users/:id/status", protect, adminOnly, toggleUserStatus);
router.delete("/users/:id", protect, adminOnly, deleteUser);

export default router;
