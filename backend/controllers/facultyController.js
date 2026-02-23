const User = require('../models/User');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Announcement = require('../models/Announcement');
const Timetable = require('../models/Timetable');

// @desc    Get faculty profile
// @route   GET /api/faculty/profile
// @access  Private (Faculty)
exports.getProfile = async (req, res) => {
    try {
        const faculty = await User.findById(req.user._id)
            .select('-password')
            .populate('subjects', 'code name credits semester');

        res.status(200).json({
            success: true,
            data: faculty
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get the ONE subject assigned to THIS faculty (their registered subject)
// @route   GET /api/faculty/my-subject
// @access  Private (Faculty)
exports.getMySubject = async (req, res) => {
    try {
        const faculty = await User.findById(req.user._id)
            .populate('registeredSubject', 'code name credits semester branch');

        if (!faculty) {
            return res.status(404).json({
                success: false,
                message: 'Faculty not found'
            });
        }

        // Return the single registered subject
        if (!faculty.registeredSubject) {
            return res.status(404).json({
                success: false,
                message: 'No subject registered to this faculty account.'
            });
        }

        res.status(200).json({
            success: true,
            data: faculty.registeredSubject
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get subjects taught by faculty
// @route   GET /api/faculty/subjects
// @access  Private (Faculty)
exports.getSubjects = async (req, res) => {
    try {
        // Return ALL active subjects for the department/semester (Simplification for shared portal)
        // In a real multi-tenancy app we would filter by branch/sem, but for this specific request:
        const subjects = await Subject.find({
            isActive: true
        }).populate('faculty', 'name');

        res.status(200).json({
            success: true,
            data: subjects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get students by subject
// @route   GET /api/faculty/students/:subjectId
// @access  Private (Faculty)
exports.getStudentsBySubject = async (req, res) => {
    try {
        const { subjectId } = req.params;

        // Verify faculty teaches this subject
        const subject = await Subject.findById(subjectId);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        // Shared portal: Removed strict faculty check
        // if (subject.faculty.toString() !== req.user._id.toString()) { ... }

        // Get all students for this subject's semester and branch
        const students = await User.find({
            role: 'student',
            semester: subject.semester,
            branch: subject.branch,
            isActive: true
        })
            .select('name email rollNumber')
            .sort({ rollNumber: 1 });

        res.status(200).json({
            success: true,
            data: students
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Mark / Update attendance (UPSERT: create if not exists, update if exists)
// @route   POST /api/faculty/attendance
// @access  Private (Faculty)
exports.markAttendance = async (req, res) => {
    try {
        const { subjectId, date, period, records } = req.body;

        // Validate input
        if (!subjectId || !date || !period || !records) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Verify subject exists
        const subject = await Subject.findById(subjectId);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        // Normalize date to start of day (strip time component) to avoid midnight offset issues
        const attendanceDate = new Date(date);
        attendanceDate.setUTCHours(0, 0, 0, 0);

        // SMART UPSERT: Check if attendance already exists for this date + period + subject
        const existingAttendance = await Attendance.findOne({
            subject: subjectId,
            date: attendanceDate,
            period
        });

        let attendance;
        let isUpdate = false;

        if (existingAttendance) {
            // UPDATE MODE: Modify existing attendance record
            existingAttendance.records = records;
            existingAttendance.faculty = req.user._id; // update who last modified
            await existingAttendance.save();
            attendance = existingAttendance;
            isUpdate = true;
            console.log(`✏️ Attendance UPDATED for ${subject.code} | ${date} | Period ${period}`);
        } else {
            // CREATE MODE: New attendance record
            attendance = await Attendance.create({
                subject: subjectId,
                faculty: req.user._id,
                date: attendanceDate,
                period,
                semester: subject.semester,
                branch: subject.branch,
                records
            });
            console.log(`✅ Attendance CREATED for ${subject.code} | ${date} | Period ${period}`);
        }

        res.status(isUpdate ? 200 : 201).json({
            success: true,
            message: isUpdate
                ? 'Attendance updated successfully'
                : 'Attendance marked successfully',
            mode: isUpdate ? 'update' : 'create',
            data: attendance
        });
    } catch (error) {
        console.error('Attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Check if attendance exists for a date/period/subject
// @route   GET /api/faculty/attendance/check
// @access  Private (Faculty)
exports.checkAttendance = async (req, res) => {
    try {
        const { subjectId, date, period } = req.query;

        if (!subjectId || !date || !period) {
            return res.status(400).json({
                success: false,
                message: 'subjectId, date, and period are required'
            });
        }

        const attendanceDate = new Date(date);
        attendanceDate.setUTCHours(0, 0, 0, 0);

        const existing = await Attendance.findOne({
            subject: subjectId,
            date: attendanceDate,
            period: Number(period)
        }).populate('records.student', 'name rollNumber');

        res.status(200).json({
            success: true,
            exists: !!existing,
            mode: existing ? 'update' : 'create',
            data: existing || null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get attendance by subject and date
// @route   GET /api/faculty/attendance/:subjectId
// @access  Private (Faculty)
exports.getAttendanceBySubject = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { date } = req.query;

        // Verify faculty teaches this subject
        const subject = await Subject.findById(subjectId);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        // Shared portal: Removed strict faculty ownership check
        // (other faculty endpoints like getStudentsBySubject already follow this pattern)

        const query = { subject: subjectId };
        if (date) {
            query.date = new Date(date);
        }

        const attendance = await Attendance.find(query)
            .populate('records.student', 'name rollNumber')
            .sort({ date: -1, period: 1 });

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

// @desc    Get the COUNT of distinct attendance sessions (classes conducted) for a subject
// @route   GET /api/faculty/attendance/count/:subjectId
// @access  Private (Faculty)
exports.getAttendanceCount = async (req, res) => {
    try {
        const { subjectId } = req.params;

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        // Count distinct attendance sessions (each document = one class session)
        const count = await Attendance.countDocuments({ subject: subjectId });

        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Enter marks
// @route   POST /api/faculty/marks
// @access  Private (Faculty)
exports.enterMarks = async (req, res) => {
    try {
        const { subjectId, studentId, examType, marksObtained, totalMarks } = req.body;

        // Validate input
        if (!subjectId || !studentId || !examType || marksObtained === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Verify faculty teaches this subject
        const subject = await Subject.findById(subjectId);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        // Shared portal: Removed strict faculty check
        // if (subject.faculty.toString() !== req.user._id.toString()) {
        //     return res.status(403).json({
        //         success: false,
        //         message: 'Not authorized to enter marks for this subject'
        //     });
        // }

        // Verify student exists
        const student = await User.findById(studentId);

        if (!student || student.role !== 'student') {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Create or update marks
        const marks = await Marks.findOneAndUpdate(
            {
                student: studentId,
                subject: subjectId,
                semester: student.semester,
                examType
            },
            {
                marksObtained,
                totalMarks: totalMarks || 20,
                enteredBy: req.user._id
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        res.status(201).json({
            success: true,
            message: 'Marks entered successfully',
            data: marks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get marks by subject
// @route   GET /api/faculty/marks/:subjectId
// @access  Private (Faculty)
exports.getMarksBySubject = async (req, res) => {
    try {
        const { subjectId } = req.params;

        // Verify faculty teaches this subject
        const subject = await Subject.findById(subjectId);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        // Shared portal: Removed strict faculty check
        // if (subject.faculty.toString() !== req.user._id.toString()) {
        //     return res.status(403).json({
        //         success: false,
        //         message: 'Not authorized'
        //     });
        // }

        const marks = await Marks.find({ subject: subjectId })
            .populate('student', 'name rollNumber')
            .sort({ 'student.rollNumber': 1, examType: 1 });

        res.status(200).json({
            success: true,
            data: marks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Post announcement
// @route   POST /api/faculty/announcements
// @access  Private (Faculty)
exports.postAnnouncement = async (req, res) => {
    try {
        const { title, message, targetRole, subjectId, priority } = req.body;

        // Validate input
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide title and message'
            });
        }

        const announcementData = {
            title,
            message,
            targetRole: targetRole || 'student',
            createdBy: req.user._id,
            priority: priority || 'medium'
        };

        if (subjectId) {
            // Verify faculty teaches this subject
            const subject = await Subject.findById(subjectId);

            // Shared portal: Removed strict faculty check
            // if (!subject || subject.faculty.toString() !== req.user._id.toString()) {
            //     return res.status(403).json({
            //         success: false,
            //         message: 'Not authorized to post for this subject'
            //     });
            // }

            if (!subject) {
                return res.status(404).json({
                    success: false,
                    message: 'Subject not found'
                });
            }

            announcementData.subject = subjectId;
            announcementData.targetSemester = subject.semester;
            announcementData.targetBranch = subject.branch;
        }

        const announcement = await Announcement.create(announcementData);

        res.status(201).json({
            success: true,
            message: 'Announcement posted successfully',
            data: announcement
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get faculty announcements
// @route   GET /api/faculty/announcements
// @access  Private (Faculty)
exports.getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find({
            $or: [
                { createdBy: req.user._id },
                { targetRole: 'faculty' },
                { targetRole: 'all' }
            ],
            isActive: true
        })
            .populate('createdBy', 'name role')
            .populate('subject', 'name code')
            .sort({ createdAt: -1 })
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

// @desc    Get timetable
// @route   GET /api/faculty/timetable
// @access  Private (Faculty)
exports.getTimetable = async (req, res) => {
    try {
        // Find timetable for the semester/branch the faculty is teaching
        // For this specific use case, we are focusing on CSE 3rd Year 2nd Sem (Sem 6)
        // In a real app, we might need to handle multiple timetables if faculty teaches across semesters
        // Here we'll try to find the timetable matching one of their subjects, or default to CSE/6

        const faculty = await User.findById(req.user._id).populate('subjects');
        let semester = 6;
        let branch = 'CSE';

        if (faculty && faculty.subjects && faculty.subjects.length > 0) {
            semester = faculty.subjects[0].semester;
            branch = faculty.subjects[0].branch;
        }

        const timetable = await Timetable.findOne({
            semester: semester,
            branch: branch,
            isActive: true
        })
            .populate('slots.subject', 'code name')
            .populate('slots.faculty', 'name');

        if (!timetable) {
            return res.status(404).json({
                success: false,
                message: 'Timetable not found'
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
