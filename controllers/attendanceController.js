import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";

// @desc    កត់ ឬកែប្រែវត្តមានសិស្សច្រើននាក់ក្នុងពេលតែមួយ (Bulk Save/Update)
// @route   POST /api/attendances/bulk
// @access  Private (Admin / Teacher)
export const saveBulkAttendance = async (req, res) => {
  try {
    const { classId, date, records } = req.body;
    // records ជា Array ទម្រង់៖ [{ studentId: "...", status: "Present" | "Absent" | "Permission" | "Late", note: "..." }]

    if (!classId || !date || !records || !Array.isArray(records)) {
      return res
        .status(400)
        .json({
          message:
            "សូមផ្ដល់ទិន្នន័យ classId, date, និង records ឱ្យបានត្រឹមត្រូវ",
        });
    }

    const recordedBy = req.user._id;

    // ប្រើ BulkOps (bulkWrite) ដើម្បីរក្សាទុក ឬកែប្រែទិន្នន័យក្នុងពេលតែមួយមានប្រសិទ្ធភាពខ្ពស់
    const operations = records.map((record) => ({
      updateOne: {
        filter: { studentId: record.studentId, date },
        update: {
          $set: {
            classId,
            date,
            status: record.status || "Present",
            note: record.note || "",
            recordedBy,
          },
        },
        upsert: true, // ប្រសិនបើមិនទាន់មាន វានឹងបង្កើតថ្មី
      },
    }));

    await Attendance.bulkWrite(operations);

    res.status(200).json({ message: "រក្សាទុកវត្តមានបានជោគជ័យ" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    ទាញយកវត្តមានតាមថ្នាក់រៀន និងកាលបរិច្ឆេទ (YYYY-MM-DD)
// @route   GET /api/attendances/class/:classId
// @access  Private
export const getAttendanceByClassAndDate = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query; // ឧ. /api/attendances/class/123?date=2026-09-04

    if (!date) {
      return res.status(400).json({ message: "សូមបញ្ចូលកាលបរិច្ឆេទ (date)" });
    }

    // ទាញបញ្ជីសិស្សទាំងអស់ក្នុងថ្នាក់នោះ
    const students = await Student.find({ classId }).sort({ nameKhmer: 1 });

    // ទាញយកកំណត់ត្រាវត្តមានដែលមានស្រាប់ក្នុងថ្ងៃនោះ
    const attendances = await Attendance.find({ classId, date });

    // រៀបចំ Mapping ស្ថានភាពវត្តមានជូនសិស្សម្នាក់ៗ
    const attendanceMap = {};
    attendances.forEach((att) => {
      attendanceMap[att.studentId.toString()] = {
        status: att.status,
        note: att.note,
        attendanceId: att._id,
      };
    });

    // បញ្ចូលទិន្នន័យសិស្ស និងវត្តមានដែលស្រង់រួច (បើមិនទាន់ស្រង់ ដាក់ default ថា Present)
    const result = students.map((student) => {
      const record = attendanceMap[student._id.toString()];
      return {
        studentId: student._id,
        customStudentId: student.studentId,
        nameKhmer: student.nameKhmer,
        nameLatin: student.nameLatin,
        gender: student.gender,
        photoUrl: student.photoUrl,
        status: record ? record.status : "Present",
        note: record ? record.note : "",
        isRecorded: !!record,
      };
    });

    res.json({
      classId,
      date,
      students: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    ទាញយករបាយការណ៍សង្ខេបវត្តមានតាមថ្នាក់រៀន
// @route   GET /api/attendances/report/:classId
// @access  Private
export const getAttendanceReport = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    const filter = { classId };
    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const attendances = await Attendance.find(filter)
      .populate("studentId", "nameKhmer nameLatin studentId gender photoUrl")
      .sort({ date: -1 });

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
