import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import Class from "../models/Class.js";

// Helper function ទាញយកកាលបរិច្ឆេទតាម Timezone កម្ពុជា (UTC+7)
const getLocalTodayDate = () => {
  const now = new Date();
  const cambodiaOffset = 7 * 60; // UTC+7 ជា minute
  const localTime = new Date(
    now.getTime() + (cambodiaOffset + now.getTimezoneOffset()) * 60000
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

// @desc    ទាញយកសង្ខេបភាគរយវត្តមានថ្ងៃនេះ និងប្រវត្តិប្រចាំសប្តាហ៍ (ចន្ទ - សុក្រ)
// @route   GET /api/attendances/today-summary
// @access  Private
export const getTodayAttendanceSummary = async (req, res) => {
  try {
    const today = getLocalTodayDate();

    // 1. ទាញយក summary ថ្ងៃនេះ
    const todayAttendanceDocs = await Attendance.find({ date: today });
    const totalMarked = todayAttendanceDocs.length;

    let presentCount = 0;
    let absentCount = 0;
    let permissionCount = 0;
    let lateCount = 0;

    todayAttendanceDocs.forEach((doc) => {
      if (doc.status === "Present") presentCount++;
      else if (doc.status === "Late") lateCount++;
      else if (doc.status === "Absent") absentCount++;
      else if (doc.status === "Permission") permissionCount++;
    });

    const attendanceRate =
      totalMarked > 0
        ? Math.round(((presentCount + lateCount) / totalMarked) * 100)
        : 0;
    const absenceRate =
      totalMarked > 0
        ? Math.round(((absentCount + permissionCount) / totalMarked) * 100)
        : 0;

    // 2. គណនាទិន្នន័យពីថ្ងៃចន្ទ ដល់ សុក្រ នៃសប្តាហ៍បច្ចុប្បន្ន
    const now = new Date();
    const cambodiaOffset = 7 * 60;
    const localTime = new Date(
      now.getTime() + (cambodiaOffset + now.getTimezoneOffset()) * 60000
    );

    const dayOfWeek = localTime.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const mondayDate = new Date(localTime);
    mondayDate.setDate(localTime.getDate() + diffToMonday);

    const daysKhmer = ["ចន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ"];
    const weeklySummary = [];

    for (let i = 0; i < 5; i++) {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];

      const dayDocs = await Attendance.find({ date: dateStr });
      const dayTotal = dayDocs.length;

      let dayPresent = 0;
      let dayAbsent = 0;

      dayDocs.forEach((doc) => {
        if (doc.status === "Present" || doc.status === "Late") dayPresent++;
        else dayAbsent++;
      });

      weeklySummary.push({
        day: daysKhmer[i],
        date: dateStr,
        present: dayTotal > 0 ? Math.round((dayPresent / dayTotal) * 100) : 0,
        absent: dayTotal > 0 ? Math.round((dayAbsent / dayTotal) * 100) : 0,
      });
    }

    res.json({
      today,
      totalMarked,
      presentCount,
      absentCount,
      permissionCount,
      lateCount,
      attendanceRate: `${attendanceRate}%`,
      absenceRate: `${absenceRate}%`,
      weeklySummary,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};