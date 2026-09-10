import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, "សូមបញ្ចូលអត្តលេខសិស្ស"],
      trim: true,
      unique: true,
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
      enum: {
        values: ["Male", "Female"],
        message: "ភេទត្រូវតែជា Male ឬ Female",
      },
      required: [true, "សូមជ្រើសរើសភេទ"],
      set: (val) => {
        if (val === "ប្រុស") return "Male";
        if (val === "ស្រី") return "Female";
        return val;
      },
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
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

studentSchema.index({ nameKhmer: "text", nameLatin: "text" });

const Student = mongoose.model("Student", studentSchema);
export default Student;