import Class from "../models/Class.js";

// @desc    Get all classes
// @route   GET /api/classes
export const getClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate("teacher", "name email");
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new class
// @route   POST /api/classes
export const createClass = async (req, res) => {
  try {
    const { className, academicYear, teacher, gradeLevel } = req.body;
    const newClass = await Class.create({
      className,
      academicYear,
      teacher,
      gradeLevel,
    });
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
