import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import Class from "../models/Class.js";

// Helper function សម្រាប់ទាញយកកាលបរិច្ឆេទថ្ងៃនេះតាម Timezone កម្ពុជា (Asia/Phnom_Penh - UTC+7)
const getLocalTodayDate = () => {
  const now = new Date();
  const cambodiaOffset = 7 * 60; // UTC+7 ជា minute
  const localTime = new Date(
    now.getTime() + (cambodiaOffset + now.getTimezoneOffset()) * 60000,
  );
  return localTime.toISOString().split("T")[0];
};

// @desc    កត់ ឬកែប្រែវត្តមានសិស្សច្រើននាក់ក្នុងពេលតែមួយ (Bulk Save/Update)
// @route   POST /api/attendances/bulk
// @access  Private (Admin / Teacher)
export const saveBulkAttendance = async (req, res) => {
  try {
    const { classId, date, records } = req.body;

    if (!classId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({
        message: "សូមផ្ដល់ទិន្នន័យ classId, date, និង records ឱ្យបានត្រឹមត្រូវ",
      });
    }

    const recordedBy = req.user._id;

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
        upsert: true,
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
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "សូមបញ្ចូលកាលបរិច្ឆេទ (date)" });
    }

    const students = await Student.find({ classId }).sort({ nameKhmer: 1 });
    const attendances = await Attendance.find({ classId, date });

    const attendanceMap = {};
    attendances.forEach((att) => {
      attendanceMap[att.studentId.toString()] = {
        status: att.status,
        note: att.note,
        attendanceId: att._id,
      };
    });

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

// @desc    ទាញយកសង្ខេបភាគរយវត្តមាន និងអវត្តមានប្រចាំថ្ងៃ (បំបែករវាង Teacher & Admin)
// @route   GET /api/attendances/today-summary
// @access  Private
export const getTodayAttendanceSummary = async (req, res) => {
  try {
    // 1. បង្កើត Date តាម Timezone កម្ពុជា (Asia/Phnom_Penh - UTC+7)
    const now = new Date();
    const cambodiaOffset = 7 * 60; // UTC+7 ជា minute
    const localTime = new Date(
      now.getTime() + (cambodiaOffset + now.getTimezoneOffset()) * 60000,
    );
    const today = localTime.toISOString().split("T")[0];

    let studentFilter = {};
    let attendanceFilter = { date: today };

    if (req.user && req.user.role === "teacher") {
      const myClasses = await Class.find({
        $or: [
          { homeroomTeacher: req.user._id },
          { assignedTeachers: req.user._id },
        ],
      });
      const myClassIds = myClasses.map((c) => c._id);

      studentFilter = { classId: { $in: myClassIds } };
      attendanceFilter.classId = { $in: myClassIds };
    }

    const totalStudents = await Student.countDocuments(studentFilter);
    const todayAttendanceDocs = await Attendance.find(attendanceFilter);

    // ករណីគ្មានសិស្ស ឬមិនទាន់ស្រង់វត្តមានសោះ
    if (totalStudents === 0 || todayAttendanceDocs.length === 0) {
      return res.json({
        today,
        totalStudents,
        attendanceRate: "0%",
        absenceRate: "0%",
      });
    }

    let presentCount = 0;
    let absentCount = 0;

    todayAttendanceDocs.forEach((doc) => {
      if (doc.status === "Present" || doc.status === "Late") {
        presentCount++;
      } else if (doc.status === "Absent" || doc.status === "Permission") {
        absentCount++;
      }
    });

    // ភាគបែងត្រូវយកចំនួនសិស្សដែលបានស្រង់វត្តមានរួច (Total Marked)
    const totalMarked = todayAttendanceDocs.length;

    // គណនាភាគរយ
    const attendancePercentage = Math.round((presentCount / totalMarked) * 100);
    const absencePercentage = Math.round((absentCount / totalMarked) * 100);

    res.json({
      today,
      totalStudents,
      totalMarked,
      presentCount,
      absentCount,
      attendanceRate: `${attendancePercentage}%`,
      absenceRate: `${absencePercentage}%`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
