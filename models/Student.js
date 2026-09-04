import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, "សូមបញ្ចូលអត្តលេខសិស្ស"],
      unique: true,
      trim: true,
    },
    nameKhmer: {
      type: String,
      required: [true, "សូមបញ្ចូលឈ្មោះជាភាសាខ្មែរ"],
      trim: true,
    },
    nameLatin: {
      type: String,
      required: [true, "សូមបញ្ចូលឈ្មោះជាអក្សរឡាតាំង"],
      trim: true,
      uppercase: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "ប្រុស", "ស្រី"],
      required: true,
    },
    dob: {
      type: Date,
      required: [true, "សូមបញ្ចូលថ្ងៃខែឆ្នាំកំណើត"],
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "សូមជ្រើសរើសថ្នាក់រៀន"],
    },
    photoUrl: {
      type: String,
      default:
        "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    },
    parentPhone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const Student = mongoose.model("Student", studentSchema);
export default Student;
