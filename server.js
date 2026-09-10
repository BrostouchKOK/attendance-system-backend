import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";

dotenv.config();

// ភ្ជាប់ទៅកាន់ Database
connectDB();

const app = express();

// ==========================================
// 1. Middlewares Configuration
// ==========================================

// កំណត់ CORS Policy (អនុញ្ញាត All Origins ក្នុង Dev ឬកំណត់ Origin ក្នុង Production)
const corsOptions = {
  origin: process.env.CLIENT_URL || "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Parse JSON payload
app.use(express.json());

// Parse URL-encoded body (សំខាន់ខ្លាំងសម្រាប់ Form Data)
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 2. API Routes
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/attendances", attendanceRoutes);

// Root Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Attendance System API is running smoothly..." });
});

// ==========================================
// 3. Error Handling Middlewares (ត្រូវដាក់ខាងក្រោម Routes ទាំងអស់)
// ==========================================

// 404 - Not Found Handler
app.use((req, res, next) => {
  const error = new Error(`រកមិនឃើញ Endpoint - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || "មានបញ្ហាបច្ចេកទេសកើតឡើងនៅក្នុង Server",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// ==========================================
// 4. Server Listener
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});