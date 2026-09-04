import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "សូមបញ្ចូលឈ្មោះរបស់អ្នកប្រើប្រាស់"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "សូមបញ្ចូលអ៊ីមែល"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "សូមបញ្ចូលពាក្យសម្ងាត់"],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "teacher"],
      default: "teacher",
    },
    phone: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

// Hash Password មុនពេល រក្សាទុក
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method ផ្ទៀងផ្ទាត់ Password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
