import Student from "../models/Student.js";

// @desc    Get total student count
// @route   GET /api/students/count
export const getStudentCount = async (req, res) => {
  try {
    const count = await Student.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all students (or filter by classId/search)
// @route   GET /api/students
export const getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const classId = req.query.classId || "";

    let query = {};

    if (classId) {
      query.classId = classId;
    }

    if (search) {
      query.$or = [
        { nameKhmer: { $regex: search, $options: "i" } },
        { nameLatin: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }

    const totalStudents = await Student.countDocuments(query);

    const students = await Student.find(query)
      .populate("classId", "className academicYear")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      students,
      page,
      pages: Math.ceil(totalStudents / limit) || 1,
      totalStudents,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      "classId",
      "className academicYear"
    );
    if (!student) {
      return res.status(404).json({ message: "រកមិនឃើញទិន្នន័យសិស្ស" });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create student
// @route   POST /api/students
export const createStudent = async (req, res) => {
  try {
    let {
      studentId,
      nameKhmer,
      nameLatin,
      gender,
      dob,
      classId,
      parentPhone,
      address,
    } = req.body;

    if (!nameKhmer || !nameLatin || !classId) {
      return res
        .status(400)
        .json({ message: "សូមបញ្ចូលព័ត៌មានចាំបាច់ឱ្យបានគ្រប់គ្រាន់" });
    }

    // ១. ពិនិត្យមើលអត្តលេខសិស្ស៖
    if (studentId && String(studentId).trim() !== "") {
      studentId = String(studentId).trim();
      const existingStudent = await Student.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({ message: "អត្តលេខសិស្សនេះមានរួចហើយ!" });
      }
    } else {
      // បើមិនបានបញ្ចូល (ទុកទទេ) -> ស្វែងរកសិស្សដែលបង្កើតចុងក្រោយគេដែលមានទម្រង់ STU-XXXX
      const lastStudent = await Student.findOne({
        studentId: { $regex: /^STU-\d+$/ },
      }).sort({ createdAt: -1 });

      let nextNumber = 1001; // ចាប់ផ្តើមពី 1001 ប្រសិនបើមិនទាន់មានសិស្សទាល់តែសោះ

      if (lastStudent && lastStudent.studentId) {
        const parts = lastStudent.studentId.split("-");
        if (parts.length === 2 && !isNaN(parts[1])) {
          nextNumber = parseInt(parts[1], 10) + 1;
        }
      }

      // បង្កើតអត្តលេខទម្រង់៖ STU-1001, STU-1002, ...
      studentId = `STU-${nextNumber}`;
    }

    // ២. បង្កើត និងរក្សាទុក
    const student = new Student({
      studentId,
      nameKhmer,
      nameLatin,
      gender: gender || "Male",
      dob,
      classId,
      parentPhone,
      address,
      photoUrl: req.file ? req.file.path : undefined,
    });

    const savedStudent = await student.save();
    const populatedStudent = await Student.findById(savedStudent._id).populate(
      "classId",
      "className academicYear"
    );

    res.status(201).json(populatedStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
export const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (studentId && String(studentId).trim() !== "") {
      const formattedStudentId = String(studentId).trim();
      const existingStudent = await Student.findOne({
        studentId: formattedStudentId,
        _id: { $ne: req.params.id },
      });

      if (existingStudent) {
        return res.status(400).json({
          message: "អត្តលេខសិស្សនេះត្រូវបានប្រើប្រាស់ដោយសិស្សផ្សេងរួចហើយ!",
        });
      }
      req.body.studentId = formattedStudentId;
    } else if (studentId === "") {
      req.body.studentId = null;
    }

    if (req.file) {
      req.body.photoUrl = req.file.path;
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("classId", "className academicYear");

    if (!updatedStudent) {
      return res
        .status(404)
        .json({ message: "រកមិនឃើញទិន្នន័យសិស្សដើម្បីកែប្រែ" });
    }

    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "រកមិនឃើញទិន្នន័យសិស្ស" });
    }
    await student.deleteOne();
    res.json({ message: "លុបទិន្នន័យសិស្សជោគជ័យ" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk Transfer Students
// @route   PUT /api/students/bulk-transfer
export const bulkTransferStudents = async (req, res) => {
  try {
    const { studentIds, targetClassId } = req.body;

    if (
      !studentIds ||
      !Array.isArray(studentIds) ||
      studentIds.length === 0 ||
      !targetClassId
    ) {
      return res
        .status(400)
        .json({ message: "សូមជ្រើសរើសសិស្ស និងថ្នាក់គោលដៅឱ្យបានត្រឹមត្រូវ" });
    }

    await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: { classId: targetClassId } }
    );

    res.json({
      message: `បានផ្ទេរសិស្សចំនួន ${studentIds.length} នាក់ទៅថ្នាក់ថ្មីជោគជ័យ!`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};