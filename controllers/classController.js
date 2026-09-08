import Class from "../models/Class.js";

// @desc    ទាញយកបញ្ជីឆ្នាំសិក្សាទាំងអស់ដែលមានក្នុង System (Unique & Sorted)
// @route   GET /api/classes/academic-years
// @access  Private
export const getAcademicYears = async (req, res) => {
  try {
    const years = await Class.distinct("academicYear");
    years.sort((a, b) => b.localeCompare(a));
    res.json(years);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all classes (Filtered by Academic Year & Teacher Role)
// @route   GET /api/classes?academicYear=2026-2027
// @access  Private
export const getClasses = async (req, res) => {
  try {
    const { academicYear } = req.query;
    let query = {};

    if (academicYear && academicYear !== "all") {
      query.academicYear = academicYear;
    }

    if (req.user && req.user.role === "teacher") {
      query.$or = [
        { homeroomTeacher: req.user._id },
        { assignedTeachers: req.user._id },
      ];
    }

    const classes = await Class.find(query)
      .populate("homeroomTeacher", "name nameKhmer nameLatin email")
      .populate("assignedTeachers", "name nameKhmer nameLatin email")
      .sort({ className: 1 });

    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new class
// @route   POST /api/classes
// @access  Private (Admin)
export const createClass = async (req, res) => {
  try {
    const {
      className,
      academicYear,
      homeroomTeacher,
      assignedTeachers,
      gradeLevel,
    } = req.body;

    const hrTeacher =
      homeroomTeacher && String(homeroomTeacher).trim() !== ""
        ? homeroomTeacher
        : null;

    const newClass = await Class.create({
      className,
      academicYear,
      homeroomTeacher: hrTeacher,
      assignedTeachers: assignedTeachers || [],
      gradeLevel,
    });

    const populatedClass = await Class.findById(newClass._id)
      .populate("homeroomTeacher", "name nameKhmer nameLatin email")
      .populate("assignedTeachers", "name nameKhmer nameLatin email");

    res.status(201).json(populatedClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update class details
// @route   PUT /api/classes/:id
// @access  Private (Admin)
export const updateClass = async (req, res) => {
  try {
    const {
      className,
      academicYear,
      homeroomTeacher,
      assignedTeachers,
      gradeLevel,
    } = req.body;

    const hrTeacher =
      homeroomTeacher && String(homeroomTeacher).trim() !== ""
        ? homeroomTeacher
        : null;

    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      {
        className,
        academicYear,
        homeroomTeacher: hrTeacher,
        assignedTeachers: assignedTeachers || [],
        gradeLevel,
      },
      { new: true, runValidators: true },
    )
      .populate("homeroomTeacher", "name nameKhmer nameLatin email")
      .populate("assignedTeachers", "name nameKhmer nameLatin email");

    if (!updatedClass) {
      return res.status(404).json({ message: "រកមិនឃើញថ្នាក់រៀននេះទេ" });
    }

    res.json(updatedClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private (Admin)
export const deleteClass = async (req, res) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    if (!deletedClass) {
      return res.status(404).json({ message: "រកមិនឃើញថ្នាក់រៀននេះទេ" });
    }
    res.json({ message: "លុបថ្នាក់រៀនបានជោគជ័យ" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clone all classes from a source year to a target year
// @route   POST /api/classes/clone
// @access  Private (Admin)
export const cloneClassesForNewYear = async (req, res) => {
  try {
    const { sourceYear, targetYear } = req.body;

    if (!sourceYear || !targetYear) {
      return res
        .status(400)
        .json({ message: "សូមបញ្ជាក់ឆ្នាំសិក្សាចាស់ និងឆ្នាំសិក្សាថ្មី" });
    }

    const sourceClasses = await Class.find({ academicYear: sourceYear });

    if (sourceClasses.length === 0) {
      return res
        .status(404)
        .json({ message: `មិនមានថ្នាក់រៀនក្នុងឆ្នាំសិក្សា ${sourceYear} ទេ` });
    }

    const createdClasses = [];
    const skippedClasses = [];

    for (const sourceClass of sourceClasses) {
      const existingClass = await Class.findOne({
        className: sourceClass.className,
        academicYear: targetYear,
      });

      if (existingClass) {
        skippedClasses.push(sourceClass.className);
        continue;
      }

      const newClass = await Class.create({
        className: sourceClass.className,
        academicYear: targetYear,
        gradeLevel: sourceClass.gradeLevel,
        homeroomTeacher: sourceClass.homeroomTeacher,
        assignedTeachers: sourceClass.assignedTeachers,
      });

      createdClasses.push(newClass);
    }

    res.status(201).json({
      message: `បានចម្លងថ្នាក់រៀនចំនួន ${createdClasses.length} ទៅកាន់ឆ្នាំសិក្សា ${targetYear} ដោយជោគជ័យ`,
      createdCount: createdClasses.length,
      skippedClasses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
