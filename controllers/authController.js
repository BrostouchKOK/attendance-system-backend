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
// @desc    Login User
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    // ឆែកមើលថាតើមាន User និង ពាក្យសម្ងាត់ត្រូវឬទេ
    if (user && (await user.matchPassword(password))) {
      // ឆែកមើលប្រសិនបើគណនីត្រូវបានផ្អាក (isActive === false)
      if (user.isActive === false) {
        return res.status(403).json({
          message: "គណនីរបស់អ្នកត្រូវបានផ្អាកដំណើរការ។ សូមទាក់ទង Admin!",
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "អ៊ីមែល ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវ" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};

    // ប្រសិនបើ Frontend ផ្ញើ query parameter role=teacher មក
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "មិនអាចទាញយកទិន្នន័យបុគ្គលិកបានទេ" });
  }
};

// @desc    Update User Info / Reset Password
// @route   PUT /api/auth/users/:id
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "មិនរកឃើញបុគ្គលិកនេះទេ" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.phone = req.body.phone || user.phone;

    // ប្រសិនបើបញ្ជូនពាក្យសម្ងាត់ថ្មីមក វានឹងកែប្រែ
    if (req.body.password && req.body.password.trim() !== "") {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle Active/Inactive Status (ផ្អាក ឬ បើកដំណើរការគណនី)
// @route   PATCH /api/auth/users/:id/status
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "មិនរកឃើញបុគ្គលិកនេះទេ" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: "ផ្លាស់ប្តូរស្ថានភាពគណនីជោគជ័យ",
      isActive: user.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete User
// @route   DELETE /api/auth/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "មិនរកឃើញបុគ្គលិកនេះទេ" });
    }

    await user.deleteOne();
    res.json({ message: "លុបគណនីបុគ្គលិកជោគជ័យ" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
