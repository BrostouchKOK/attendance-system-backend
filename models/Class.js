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
      default: "2026-2027",
    },
    // គ្រូបន្ទុកថ្នាក់ (មាន ១ នាក់)
    homeroomTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // គ្រូបង្រៀនតាមមុខវិជ្ជា (អាចមានច្រើននាក់)
    assignedTeachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    gradeLevel: {
      type: String,
      required: [true, "សូមជ្រើសរើសកម្រិតថ្នាក់"],
    },
  },
  { timestamps: true },
);

classSchema.index({ className: 1, academicYear: 1 }, { unique: true });

const Class = mongoose.model("Class", classSchema);
export default Class;
