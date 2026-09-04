import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: [true, "សូមបញ្ចូលឈ្មោះថ្នាក់រៀន (ឧ. ថ្នាក់ទី ១០A)"],
      trim: true,
    },
    academicYear: {
      type: String,
      required: [true, "សូមបញ្ចូលឆ្នាំសិក្សា (ឧ. 2026-2027)"],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    gradeLevel: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Class = mongoose.model("Class", classSchema);
export default Class;
