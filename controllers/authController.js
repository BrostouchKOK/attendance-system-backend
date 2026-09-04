import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// @desc    Register User
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "អ៊ីមែលនេះមានក្នុងប្រព័ន្ធរួចហើយ" });
    }

    const user = await User.create({ name, email, password, role, phone });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login User
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "អ៊ីមែល ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវ" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
