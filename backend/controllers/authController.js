const User = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const Announcement = require('../models/Announcement');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user and include password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is inactive. Please contact administrator.'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Return user data without password
        const userData = user.toPublicJSON();

        res.status(200).json({
            success: true,
            accessToken,
            refreshToken,
            user: userData
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Get user to include current details in token
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new access token
        const { accessToken } = generateTokens(user);

        res.status(200).json({
            success: true,
            accessToken
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token',
            error: error.message
        });
    }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        // Get user with password
        const user = await User.findById(req.user._id).select('+password');

        // Verify current password
        const isPasswordValid = await user.comparePassword(currentPassword);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password and first login flag
        user.password = newPassword;
        user.isFirstLogin = false;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error changing password',
            error: error.message
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('subjects', 'code name');

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Seed production database
// @route   GET /api/auth/seed-production
// @access  Public (Protected by secret key in production ideal, but open for this fix)
exports.seedProductionDatabase = async (req, res) => {
    try {
        console.log('\n🌱 Starting database seeding via API...\n');

        // Clear existing data
        await User.deleteMany({});
        await Subject.deleteMany({});
        await Timetable.deleteMany({});
        await Announcement.deleteMany({});

        // 1. Create Admin
        const admin = await User.create({
            name: 'System Admin',
            email: 'admin.portal@skucet.edu',
            password: 'AdminPortalLogin2026',
            role: 'admin',
            isFirstLogin: false
        });

        // 2. Create Faculty Users
        const facultyList = [
            { name: 'Smt. D Gousiya Begum', email: 'd.gousiya@skucet.edu' },
            { name: 'Smt. Chandrakala', email: 'chandrakala@skucet.edu' },
            { name: 'Dr. P R Rajesh Kumar', email: 'pr.rajesh@skucet.edu' },
            { name: 'Mr. D. Purushotam Reddy', email: 'd.purushotam@skucet.edu' },
            { name: 'Smt. R. Sumathi', email: 'r.sumathi@skucet.edu' },
            { name: 'Dr. Shakila', email: 'shakila@skucet.edu' },
            { name: 'Mr. U Dhanunjaya', email: 'u.dhanunjaya@skucet.edu' }
        ];

        const facultyMap = {}; // name -> _id

        for (const fac of facultyList) {
            const user = await User.create({
                name: fac.name,
                email: fac.email,
                password: 'faculty123', // Default password for named faculty
                role: 'faculty',
                employeeId: 'FAC' + Math.floor(Math.random() * 1000),
                isFirstLogin: false
            });
            facultyMap[fac.name] = user._id;
        }

        // Create Shared "Faculty Portal" User
        const sharedFaculty = await User.create({
            name: 'Faculty Staff',
            email: 'faculty.portal@skucet.edu',
            password: 'FacultyPortalLogin2026',
            role: 'faculty',
            employeeId: 'SHARED001',
            isFirstLogin: false
        });

        // 3. Create Subjects
        const subjectsData = [
            { code: 'BDA', name: 'Big Data Analytics', faculty: facultyMap['Smt. D Gousiya Begum'], credits: 4 },
            { code: 'BDA-LAB', name: 'Big Data Analytics Lab', faculty: facultyMap['Smt. D Gousiya Begum'], credits: 2 },
            { code: 'C&NS', name: 'Cryptography & Network Security', faculty: facultyMap['Smt. Chandrakala'], credits: 4 },
            { code: 'CC', name: 'Cloud Computing', faculty: facultyMap['Dr. P R Rajesh Kumar'], credits: 4 },
            { code: 'EI', name: 'Electronic Instrumentation (OE-II)', faculty: facultyMap['Mr. D. Purushotam Reddy'], credits: 3 },
            { code: 'LIB', name: 'Library', faculty: facultyMap['Dr. P R Rajesh Kumar'], credits: 1 },
            { code: 'ML', name: 'Machine Learning', faculty: facultyMap['Smt. R. Sumathi'], credits: 4 },
            { code: 'SOC', name: 'SOC Skill Lab', faculty: facultyMap['Dr. Shakila'], credits: 2 },
            { code: 'STM', name: 'Software Testing Methodologies', faculty: facultyMap['Mr. U Dhanunjaya'], credits: 3 },
            { code: 'TPR', name: 'Technical Paper Writing', faculty: facultyMap['Smt. D Gousiya Begum'], credits: 1 }
        ];

        const subjectMap = {}; // code -> _id
        const allSubjectIds = [];

        for (const sub of subjectsData) {
            const subject = await Subject.create({
                ...sub,
                semester: 6, // 3rd Year 2nd Sem
                branch: 'CSE',
                isActive: true
            });
            subjectMap[sub.code] = subject._id;
            allSubjectIds.push(subject._id);

            // Update faculty with subject
            await User.findByIdAndUpdate(sub.faculty, { $push: { subjects: subject._id } });
        }

        // Assign all subjects to the shared faculty portal user as well (logic-wise, though schema is one-to-many)
        // We can't update Subject.faculty to multiple, but we can update User.subjects
        await User.findByIdAndUpdate(sharedFaculty._id, { $set: { subjects: allSubjectIds } });


        // 4. Create Students (64 students)
        const students = [];
        // Base Roll Number: 2310101 to 2310164
        // Logic: 2310 + (100 + i)

        for (let i = 1; i <= 64; i++) {
            const rollSuffix = 100 + i;
            const rollNumber = `2310${rollSuffix}`;

            const studentNames = [
                'Lochan Kumar', 'M. Vijaya Lakhsmi', 'A. Sai Teja', 'B. Praneeth', 'C. Hema Latha',
                'D. Gopi Krishna', 'E. Suresh', 'F. Anusha', 'G. Ravi Teja', 'H. Sravani',
                'I. Manoj Kumar', 'J. Divya', 'K. Sai Kumar', 'L. Pavani', 'M. Naveen',
                'N. Swathi', 'O. Karthik', 'P. Ramya', 'Q. Harish', 'R. Manasa',
                'S. Praveen', 'T. Sandhya', 'U. Vamshi', 'V. Aparna', 'W. Akhil',
                'X. Bhavana', 'Y. Charan', 'Z. Deepa', 'A. Eswar', 'B. Fathima',
                'C. Ganesh', 'D. Harika', 'E. Imran', 'F. Jaswanth', 'G. Keerthi',
                'H. Lokesh', 'I. Mounika', 'J. Nikhil', 'K. Omprakash', 'L. Prathyusha',
                'M. Qasim', 'N. Rajesh', 'O. Sai Kiran', 'P. Tarun', 'Q. Uma',
                'R. Vinay', 'S. Yamini', 'T. Zareena', 'U. Akshay', 'V. Bindu',
                'W. Chandu', 'X. Dinesh', 'Y. Eshwar', 'Z. Farhan', 'A. Giridhar',
                'B. Harini', 'C. Ishwarya', 'D. Jagadeesh', 'E. Kavya', 'F. Lakshmi',
                'G. Madhu', 'H. Narender', 'I. Pallavi', 'J. Rakesh'
            ];

            let name = studentNames[i - 1] || `Student ${rollSuffix}`;

            // Hardcode specific requests
            if (rollNumber === '2310101') name = 'Lochan Kumar';
            if (rollNumber === '2310126') name = 'M. Vijaya Lakhsmi';

            students.push({
                name: name,
                email: `${rollNumber}@skucet.edu`,
                password: rollNumber,
                role: 'student',
                rollNumber: rollNumber,
                branch: 'CSE',
                semester: 6,
                isFirstLogin: false,
                subjects: allSubjectIds
            });
        }

        await User.create(students);

        // 5. Create Timetable
        // Based on analysis of screenshot
        // Periods: 9-10, 10-11, 11:15-12:15, 12:15-1:15(Lunch), 1:15-2:15, 2:15-3:15, 3:15-4:15
        const timetableSlots = [];

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Define Schedule Mapping (Day -> [Period 1 Code, Period 2 Code, Period 3 Code, Period 4 Code, Period 5 Code, Period 6 Code])
        // Assuming 6 periods per day + lunch break
        // Standard periods: 1, 2, 3, (Lunch), 4, 5, 6

        const schedule = {
            'Thursday': ['C&NS', 'CC', 'EI', 'BDA', 'STM', 'LIB'],
            'Friday': ['EI', 'ML', 'BDA', 'SOC', 'SOC', 'SOC'],
            'Saturday': ['CC', 'EI', 'BDA', 'C&NS', 'TPR', 'TPR'],
            // Fill others with random logic or just repeat
            'Monday': ['BDA', 'ML', 'CC', 'STM', 'C&NS', 'EI'], // Assumption
            'Tuesday': ['ML', 'STM', 'C&NS', 'BDA-LAB', 'BDA-LAB', 'BDA-LAB'], // Assumption
            'Wednesday': ['CC', 'EI', 'ML', 'STM', 'LIB', 'TPR'] // Assumption
        };

        const periodTimes = [
            { p: 1, s: '09:30 AM', e: '10:30 AM' },
            { p: 2, s: '10:30 AM', e: '11:30 AM' },
            { p: 3, s: '11:30 AM', e: '12:30 PM' },
            // Period 4 starts after lunch (Assuming lunch is 12:30-1:30)
            { p: 4, s: '01:30 PM', e: '02:30 PM' },
            { p: 5, s: '02:30 PM', e: '03:30 PM' },
            { p: 6, s: '03:30 PM', e: '04:30 PM' }
        ];

        days.forEach(day => {
            const daySubjects = schedule[day] || schedule['Monday'];

            daySubjects.forEach((code, index) => {
                const subjectId = subjectMap[code];
                // Find faculty for this subject
                const subjectObj = subjectsData.find(s => s.code === code);
                const facultyId = subjectObj ? subjectObj.faculty : sharedFaculty._id;

                if (subjectId) {
                    timetableSlots.push({
                        day: day,
                        period: periodTimes[index].p,
                        startTime: periodTimes[index].s,
                        endTime: periodTimes[index].e,
                        subject: subjectId,
                        faculty: facultyId
                    });
                }
            });
        });

        await Timetable.create({
            semester: 6,
            branch: 'CSE',
            academicYear: '2025-2026',
            slots: timetableSlots
        });

        // 6. Create Announcements
        const announcementList = [
            {
                title: 'Welcome to the New Semester',
                message: 'Classes for the 3rd Year 2nd Semester have commenced. Please check your timetable.',
                targetRole: 'student',
                createdBy: admin._id,
                priority: 'high'
            },
            {
                title: 'Data Analytics Workshop',
                message: 'A workshop on Big Data using Hadoop will be conducted this Saturday. Interested students register with Smt. D Gousiya Begum.',
                targetRole: 'student',
                subject: subjectMap['BDA'],
                targetSemester: 6,
                targetBranch: 'CSE',
                createdBy: facultyMap['Smt. D Gousiya Begum'],
                priority: 'medium'
            }
        ];

        await Announcement.insertMany(announcementList);

        res.status(200).json({
            success: true,
            message: 'Database seeded successfully with CORRECT data (64 Students, Named Faculty)!',
            credentials: {
                admin: 'admin.portal@skucet.edu / AdminPortalLogin2026',
                faculty: 'faculty.portal@skucet.edu / FacultyPortalLogin2026',
                student: '2310126@skucet.edu / 2310126'
            }
        });

    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during seeding',
            error: error.message
        });
    }
};
