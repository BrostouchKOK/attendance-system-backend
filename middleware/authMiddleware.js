import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");
      return next();
    } catch (error) {
      return res
        .status(401)
        .json({ message: "ពុំមានសិទ្ធិចូលប្រើប្រាស់ (Token បរាជ័យ)" });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "ពុំមានសិទ្ធិចូលប្រើប្រាស់ (គ្មាន Token)" });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "សម្រាប់តែ Admin ប៉ុណ្ណោះ" });
  }
};
