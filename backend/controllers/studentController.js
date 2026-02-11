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

// @desc    Get student attendance
// @route   GET /api/student/attendance
// @access  Private (Student)
exports.getAttendance = async (req, res) => {
    try {
        const student = req.user;

        // 1. Get all subjects for this student's semester and branch
        const subjects = await Subject.find({
            semester: student.semester,
            branch: student.branch,
            isActive: true
        });

        // 2. Get all attendance records for this student
        const attendanceRecords = await Attendance.find({
            'records.student': student._id
        }).populate('subject', 'code name');

        // 3. Initialize stats for ALL subjects
        const attendanceBySubject = {};

        subjects.forEach(subject => {
            attendanceBySubject[subject._id.toString()] = {
                subjectId: subject._id,
                subjectName: subject.name,
                subjectCode: subject.code,
                present: 0,
                absent: 0,
                total: 0,
                percentage: 0
            };
        });

        // 4. Populate with actual records
        attendanceRecords.forEach(record => {
            const subjectId = record.subject._id.toString();
            // Only process if subject is still in the list (e.g. not deactivated)
            if (attendanceBySubject[subjectId]) {
                const studentRecord = record.records.find(r => r.student.toString() === student._id.toString());

                if (studentRecord) {
                    if (studentRecord.status === 'P') {
                        attendanceBySubject[subjectId].present++;
                    } else {
                        attendanceBySubject[subjectId].absent++;
                    }
                    attendanceBySubject[subjectId].total++;
                }
            }
        });

        // 5. Calculate percentage
        const attendance = Object.values(attendanceBySubject).map(subject => ({
            ...subject,
            percentage: subject.total > 0
                ? ((subject.present / subject.total) * 100).toFixed(2)
                : 0
        }));

        res.status(200).json({
            success: true,
            data: attendance
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
