import Student from "../models/Student.js";

// @desc    Get all students (or filter by classId)
// @route   GET /api/students
export const getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const classId = req.query.classId || "";

    // បង្កើត Filter Condition
    let query = {};

    // Filter តាម Class ID ប្រសិនបើមាន
    if (classId) {
      query.classId = classId;
    }

    // Filter តាម Search (ឈ្មោះខ្មែរ, ឈ្មោះឡាតាំង, ឬ អត្តលេខ)
    if (search) {
      query.$or = [
        { nameKhmer: { $regex: search, $options: "i" } },
        { nameLatin: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }

    // រាប់ចំនួនសិស្សសរុបតាម Filter
    const totalStudents = await Student.countDocuments(query);

    // ទាញយកទិន្នន័យតាម Page
    const students = await Student.find(query)
      .populate("classId", "className academicYear")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      students,
      page,
      pages: Math.ceil(totalStudents / limit),
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

    let student = await Student.create({
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

    // Populate ថ្នាក់រៀនមុននឹងផ្ញើទៅ Frontend
    student = await student.populate("classId", "className academicYear");

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
    ).populate("classId", "className academicYear");

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

export const bulkTransferStudents = async (req, res) => {
  try {
    const { studentIds, targetClassId } = req.body; // studentIds ជា Array នៃ IDs

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0 || !targetClassId) {
      return res.status(400).json({ message: "សូមជ្រើសរើសសិស្ស និងថ្នាក់គោលដៅឱ្យបានត្រឹមត្រូវ" });
    }

    await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: { classId: targetClassId } }
    );

    res.json({ message: `បានផ្ទេរសិស្សចំនួន ${studentIds.length} នាក់ទៅថ្នាក់ថ្មីជោគជ័យ!` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
