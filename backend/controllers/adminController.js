const User = require('../models/User');
const Subject = require('../models/Subject');
const Announcement = require('../models/Announcement');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Timetable = require('../models/Timetable');

// ==================== STUDENT MANAGEMENT ====================

// @desc    Create student
// @route   POST /api/admin/students
// @access  Private (Admin)
exports.createStudent = async (req, res) => {
    try {
        const { name, email, rollNumber, branch, semester, password } = req.body;

        // Validate input
        if (!name || !email || !rollNumber || !branch || !semester || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { rollNumber }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Student with this email or roll number already exists'
            });
        }

        // Create student
        const student = await User.create({
            name,
            email,
            rollNumber,
            branch,
            semester,
            password,
            role: 'student',
            isFirstLogin: true
        });

        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            data: student.toPublicJSON()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private (Admin)
exports.getAllStudents = async (req, res) => {
    try {
        const { page = 1, limit = 50, semester, branch, search } = req.query;

        const query = { role: 'student' };

        if (semester) query.semester = semester;
        if (branch) query.branch = branch;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { rollNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const students = await User.find(query)
            .select('-password')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ rollNumber: 1 });

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                students,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
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

// @desc    Get single student
// @route   GET /api/admin/students/:id
// @access  Private (Admin)
exports.getStudent = async (req, res) => {
    try {
        const student = await User.findById(req.params.id)
            .select('-password')
            .populate('subjects', 'code name');

        if (!student || student.role !== 'student') {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

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

// @desc    Update student
// @route   PUT /api/admin/students/:id
// @access  Private (Admin)
exports.updateStudent = async (req, res) => {
    try {
        const { name, email, branch, semester, isActive } = req.body;

        const student = await User.findById(req.params.id);

        if (!student || student.role !== 'student') {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Update fields
        if (name) student.name = name;
        if (email) student.email = email;
        if (branch) student.branch = branch;
        if (semester) student.semester = semester;
        if (isActive !== undefined) student.isActive = isActive;

        await student.save();

        res.status(200).json({
            success: true,
            message: 'Student updated successfully',
            data: student.toPublicJSON()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete student
// @route   DELETE /api/admin/students/:id
// @access  Private (Admin)
exports.deleteStudent = async (req, res) => {
    try {
        const student = await User.findById(req.params.id);

        if (!student || student.role !== 'student') {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        await student.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ==================== FACULTY MANAGEMENT ====================

// @desc    Create faculty
// @route   POST /api/admin/faculty
// @access  Private (Admin)
exports.createFaculty = async (req, res) => {
    try {
        const { name, email, employeeId, password } = req.body;

        // Validate input
        if (!name || !email || !employeeId || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { employeeId }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Faculty with this email or employee ID already exists'
            });
        }

        // Create faculty
        const faculty = await User.create({
            name,
            email,
            employeeId,
            password,
            role: 'faculty',
            isFirstLogin: true
        });

        res.status(201).json({
            success: true,
            message: 'Faculty created successfully',
            data: faculty.toPublicJSON()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all faculty
// @route   GET /api/admin/faculty
// @access  Private (Admin)
exports.getAllFaculty = async (req, res) => {
    try {
        const { page = 1, limit = 50, search } = req.query;

        const query = { role: 'faculty' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } }
            ];
        }

        const faculty = await User.find(query)
            .select('-password')
            .populate('subjects', 'code name')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ employeeId: 1 });

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                faculty,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
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

// @desc    Delete faculty
// @route   DELETE /api/admin/faculty/:id
// @access  Private (Admin)
exports.deleteFaculty = async (req, res) => {
    try {
        const faculty = await User.findById(req.params.id);

        if (!faculty || faculty.role !== 'faculty') {
            return res.status(404).json({
                success: false,
                message: 'Faculty not found'
            });
        }

        await faculty.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Faculty deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ==================== SUBJECT MANAGEMENT ====================

// @desc    Create subject
// @route   POST /api/admin/subjects
// @access  Private (Admin)
exports.createSubject = async (req, res) => {
    try {
        const { code, name, credits, semester, branch } = req.body;

        // Validate input
        if (!code || !name || !credits || !semester || !branch) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        const subject = await Subject.create({
            code,
            name,
            credits,
            semester,
            branch
        });

        res.status(201).json({
            success: true,
            message: 'Subject created successfully',
            data: subject
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Subject with this code already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all subjects
// @route   GET /api/admin/subjects
// @access  Private (Admin)
exports.getAllSubjects = async (req, res) => {
    try {
        const { semester, branch } = req.query;

        const query = {};
        if (semester) query.semester = semester;
        if (branch) query.branch = branch;

        const subjects = await Subject.find(query)
            .populate('faculty', 'name employeeId')
            .sort({ semester: 1, code: 1 });

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

// @desc    Assign subject to faculty
// @route   POST /api/admin/subjects/assign
// @access  Private (Admin)
exports.assignSubjectToFaculty = async (req, res) => {
    try {
        const { subjectId, facultyId } = req.body;

        const subject = await Subject.findById(subjectId);
        const faculty = await User.findById(facultyId);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        if (!faculty || faculty.role !== 'faculty') {
            return res.status(404).json({
                success: false,
                message: 'Faculty not found'
            });
        }

        subject.faculty = facultyId;
        await subject.save();

        // Add subject to faculty's subjects array
        if (!faculty.subjects.includes(subjectId)) {
            faculty.subjects.push(subjectId);
            await faculty.save();
        }

        res.status(200).json({
            success: true,
            message: 'Subject assigned to faculty successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ==================== SYSTEM STATISTICS ====================

// @desc    Get system stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getSystemStats = async (req, res) => {
    try {
        const [totalStudents, totalFaculty, totalSubjects, activeAnnouncements] = await Promise.all([
            User.countDocuments({ role: 'student', isActive: true }),
            User.countDocuments({ role: 'faculty', isActive: true }),
            Subject.countDocuments({ isActive: true }),
            Announcement.countDocuments({ isActive: true })
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalStudents,
                totalFaculty,
                totalSubjects,
                activeAnnouncements
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

// @desc    Bulk create students
// @route   POST /api/admin/students/bulk
// @access  Private (Admin)
exports.bulkCreateStudents = async (req, res) => {
    try {
        const { students } = req.body;

        if (!students || !Array.isArray(students)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of students'
            });
        }

        const createdStudents = [];
        const errors = [];

        for (let studentData of students) {
            try {
                studentData.role = 'student';
                studentData.isFirstLogin = true;

                const student = await User.create(studentData);
                createdStudents.push(student.toPublicJSON());
            } catch (error) {
                errors.push({
                    data: studentData,
                    error: error.message
                });
            }
        }

        res.status(201).json({
            success: true,
            message: `${createdStudents.length} students created successfully`,
            data: {
                created: createdStudents,
                errors
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

// ==================== TIMETABLE MANAGEMENT ====================

const getStartTime = (period) => {
    const periodMap = {
        1: '09:30 AM',
        2: '10:30 AM',
        3: '11:30 AM',
        4: '01:30 PM',
        5: '02:30 PM',
        6: '03:30 PM'
    };
    return periodMap[period] || '09:00 AM';
};

const getEndTime = (period) => {
    const periodMap = {
        1: '10:30 AM',
        2: '11:30 AM',
        3: '12:30 PM',
        4: '02:30 PM',
        5: '03:30 PM',
        6: '04:30 PM'
    };
    return periodMap[period] || '10:00 AM';
};

// @desc    Get timetable
// @route   GET /api/admin/timetable
// @access  Private (Admin)
exports.getTimetable = async (req, res) => {
    try {
        // For now, let's just get the first active timetable
        // In a real app, you'd filter by semester/branch
        const timetable = await Timetable.findOne({ isActive: true })
            .populate('slots.subject', 'code name')
            .populate('slots.faculty', 'name');

        if (!timetable) {
            // Create a default one if not exists for testing
            return res.status(404).json({
                success: false,
                message: 'No active timetable found'
            });
        }

        res.status(200).json({
            success: true,
            data: timetable
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update timetable slot
// @route   PUT /api/admin/timetable/slot
// @access  Private (Admin)
exports.updateTimetableSlot = async (req, res) => {
    try {
        const { timetableId, day, period, subjectId, facultyId } = req.body;

        const timetable = await Timetable.findById(timetableId);

        if (!timetable) {
            return res.status(404).json({ success: false, message: 'Timetable not found' });
        }

        // Find existing slot index
        const slotIndex = timetable.slots.findIndex(
            s => s.day === day && s.period === parseInt(period)
        );

        const newSlot = {
            day,
            period: parseInt(period),
            startTime: getStartTime(period),
            endTime: getEndTime(period),
            subject: subjectId,
            faculty: facultyId
        };

        if (slotIndex > -1) {
            // Update existing
            timetable.slots[slotIndex] = newSlot;
        } else {
            // Add new
            timetable.slots.push(newSlot);
        }

        await timetable.save();

        const updatedTimetable = await Timetable.findById(timetableId)
            .populate('slots.subject', 'code name')
            .populate('slots.faculty', 'name');

        res.status(200).json({
            success: true,
            message: 'Timetable updated successfully',
            data: updatedTimetable
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
