const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Announcement = require('../models/Announcement');
const Timetable = require('../models/Timetable');
const Subject = require('../models/Subject');

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private (Student)
exports.getProfile = async (req, res) => {
    try {
        const student = await User.findById(req.user._id)
            .select('-password')
            .populate('subjects', 'code name credits');

        res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get student attendance (overall + current-month breakdown per subject)
// @route   GET /api/student/attendance
// @access  Private (Student)
exports.getAttendance = async (req, res) => {
    try {
        const student = req.user;

        // 1. Get all active subjects for this student's semester and branch
        const subjects = await Subject.find({
            semester: student.semester,
            branch: student.branch,
            isActive: true
        });

        // 2. Month boundaries for the CURRENT calendar month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // 3. Fetch ALL attendance records that include this student in a single query
        const allRecords = await Attendance.find({
            'records.student': student._id
        }).populate('subject', 'code name').lean();

        // 4. Build per-subject stats: overall counts + this-month counts
        const stats = {};
        subjects.forEach(sub => {
            stats[sub._id.toString()] = {
                subjectId: sub._id,
                subjectName: sub.name,
                subjectCode: sub.code,
                // Overall (entire semester)
                present: 0, absent: 0, total: 0, percentage: 0,
                // Current month only
                monthPresent: 0, monthAbsent: 0, monthTotal: 0, monthPercentage: 0
            };
        });

        allRecords.forEach(rec => {
            const subId = rec.subject?._id?.toString();
            if (!subId || !stats[subId]) return;

            const studentRec = rec.records.find(
                r => r.student.toString() === student._id.toString()
            );
            if (!studentRec) return;

            const isPresent = studentRec.status === 'P';
            const s = stats[subId];

            // Overall tallying
            if (isPresent) s.present++; else s.absent++;
            s.total++;

            // Monthly tallying (filter by current month's date range)
            const recDate = new Date(rec.date);
            if (recDate >= monthStart && recDate <= monthEnd) {
                if (isPresent) s.monthPresent++; else s.monthAbsent++;
                s.monthTotal++;
            }
        });

        // 5. Compute percentages
        const attendance = Object.values(stats).map(s => ({
            ...s,
            percentage: s.total > 0
                ? parseFloat(((s.present / s.total) * 100).toFixed(2))
                : 0,
            monthPercentage: s.monthTotal > 0
                ? parseFloat(((s.monthPresent / s.monthTotal) * 100).toFixed(2))
                : 0
        }));

        res.status(200).json({
            success: true,
            data: attendance,
            meta: {
                month: now.toLocaleString('default', { month: 'long' }),
                year: now.getFullYear()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};


// @desc    Get student marks
// @route   GET /api/student/marks
// @access  Private (Student)
exports.getMarks = async (req, res) => {
    try {
        const marks = await Marks.find({
            student: req.user._id
        })
            .populate('subject', 'code name')
            .sort({ subject: 1, examType: 1 });

        // Group marks by subject
        const marksBySubject = {};

        marks.forEach(mark => {
            const subjectId = mark.subject._id.toString();

            if (!marksBySubject[subjectId]) {
                marksBySubject[subjectId] = {
                    subjectId: mark.subject._id,
                    subjectName: mark.subject.name,
                    subjectCode: mark.subject.code,
                    mid1: null,
                    mid2: null,
                    final: null
                };
            }

            marksBySubject[subjectId][mark.examType] = mark.marksObtained;
        });

        const marksData = Object.values(marksBySubject);

        res.status(200).json({
            success: true,
            data: marksData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get student timetable
// @route   GET /api/student/timetable
// @access  Private (Student)
exports.getTimetable = async (req, res) => {
    try {
        const student = req.user;

        const timetable = await Timetable.findOne({
            semester: student.semester,
            branch: student.branch,
            isActive: true
        })
            .populate('slots.subject', 'code name')
            .populate('slots.faculty', 'name');

        if (!timetable) {
            return res.status(404).json({
                success: false,
                message: 'Timetable not found for your semester and branch'
            });
        }

        res.status(200).json({
            success: true,
            data: timetable.slots
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get student announcements
// @route   GET /api/student/announcements
// @access  Private (Student)
exports.getAnnouncements = async (req, res) => {
    try {
        const student = req.user;

        const announcements = await Announcement.find({
            isActive: true,
            $or: [
                { targetRole: 'all' },
                { targetRole: 'student' }
            ],
            $and: [
                {
                    $or: [
                        { targetSemester: { $exists: false } },
                        { targetSemester: student.semester }
                    ]
                },
                {
                    $or: [
                        { targetBranch: { $exists: false } },
                        { targetBranch: student.branch }
                    ]
                }
            ]
        })
            .populate('createdBy', 'name role')
            .populate('subject', 'name code')
            .sort({ priority: -1, createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            data: announcements
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
