import Student from "../models/Student.js";

// @desc    Get all students (or filter by classId)
// @route   GET /api/students
export const getStudents = async (req, res) => {
  try {
    const { classId } = req.query;
    const filter = classId ? { classId } : {};

    const students = await Student.find(filter).populate(
      "classId",
      "className academicYear",
    );
    res.json(students);
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
      "className academicYear",
    );
    if (!student) {
      return res.status(404).json({ message: "រកមិនឃើញទិន្នន័យសិស្ស" });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create student (with Image upload)
// @route   POST /api/students
export const createStudent = async (req, res) => {
  try {
    const {
      studentId,
      nameKhmer,
      nameLatin,
      gender,
      dob,
      classId,
      parentPhone,
      address,
    } = req.body;

    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({ message: "អត្តលេខសិស្សនេះមានរួចហើយ" });
    }

    const photoUrl = req.file ? req.file.path : undefined;

    const student = await Student.create({
      studentId,
      nameKhmer,
      nameLatin,
      gender,
      dob,
      classId,
      parentPhone,
      address,
      ...(photoUrl && { photoUrl }),
    });

    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
export const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "រកមិនឃើញទិន្នន័យសិស្ស" });
    }

    if (req.file) {
      req.body.photoUrl = req.file.path;
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
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
