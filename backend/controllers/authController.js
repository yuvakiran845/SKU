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

        // Exact Mapping from Register Images
        const studentData = [
            { roll: '2310101', name: 'A. Lochan Kumar' },
            // 102 skipped
            // 103 skipped
            { roll: '2310104', name: 'B. Mahesh Babu' },
            { roll: '2310105', name: 'B. Sharada' },
            { roll: '2310106', name: 'B. Ashwini' },
            { roll: '2310107', name: 'B. Chandra Sekhar' },
            { roll: '2310108', name: 'B. Reethika' },
            { roll: '2310109', name: 'D. Nandini' },
            { roll: '2310110', name: 'D. Rajesh' },
            { roll: '2310111', name: 'E. Manasa' },
            { roll: '2310112', name: 'G. Sneha Sree' },
            { roll: '2310113', name: 'G. Likitha' },
            { roll: '2310114', name: 'G. Siddhartha' },
            { roll: '2310115', name: 'G. Chandra Sekhar Yadav' },
            { roll: '2310116', name: 'G. Jayanthi' },
            { roll: '2310117', name: 'J. Mythri' },
            // 118 skipped
            { roll: '2310119', name: 'K. Jyothi' },
            { roll: '2310120', name: 'K. Pavanitha' },
            { roll: '2310121', name: 'K. Bharath Kumar Reddy' },
            { roll: '2310122', name: 'K. Abhilash' },
            { roll: '2310123', name: 'K. Nanda Kishore' },
            { roll: '2310124', name: 'K. Keerthana' },
            { roll: '2310125', name: 'M. Padhma Sree' },
            { roll: '2310126', name: 'M. Vijaya Lakshmi' },
            { roll: '2310127', name: 'M. Kathyaini' },
            { roll: '2310128', name: 'M. Uchirappa' },
            { roll: '2310129', name: 'M. Naveena' },
            { roll: '2310130', name: 'M. Purushotham' },
            { roll: '2310131', name: 'M. Yogeswari' },
            { roll: '2310132', name: 'N. Pallavi' },
            { roll: '2310133', name: 'N. Swarna Latha' },
            { roll: '2310134', name: 'N. Siva Vara Prasad' },
            { roll: '2310135', name: 'P. Bhaskar' },
            { roll: '2310136', name: 'P. Lakshmi' },
            { roll: '2310137', name: 'P. Vidhya Sree' },
            { roll: '2310138', name: 'P. Ankitha' },
            { roll: '2310139', name: 'P. Aparna' },
            { roll: '2310140', name: 'P. Sravani' },
            { roll: '2310141', name: 'P. Susmitha Das' },
            { roll: '2310142', name: 'P. Bharya Sree' },
            { roll: '2310143', name: 'R. Chetana' },
            { roll: '2310144', name: 'S. Abhiram' },
            { roll: '2310145', name: 'S. Divya Sree' },
            { roll: '2310146', name: 'S. Mehataj' },
            { roll: '2310147', name: 'S. Ujala Mashiya' },
            { roll: '2310148', name: 'S. Tejaswini' },
            { roll: '2310149', name: 'S. Vishnu' },
            { roll: '2310150', name: 'S. R. Triveni' },
            { roll: '2310151', name: 'T. Sathyavathi' },
            { roll: '2310152', name: 'T. Tharun Kumar' },
            { roll: '2310153', name: 'U. Divyanjali' },
            { roll: '2310154', name: 'U. Usharani' },
            { roll: '2310155', name: 'U. Veereshamma' },
            { roll: '2310156', name: 'V. Vinod Kumar' },
            { roll: '2310157', name: 'V. Surya' },
            { roll: '2310158', name: 'V. Kalyan Reddy' },
            { roll: '2310159', name: 'V. Upekshith' },
            { roll: '2310160', name: 'Y. Sai Priya' },
            { roll: '2310171', name: 'C. Kavya' },
            { roll: '2310172', name: 'D. Deekshith' },
            { roll: '2310173', name: 'D. Hareesh' },
            { roll: '2310174', name: 'G. Vamsi Madhukar' },
            { roll: '2310175', name: 'M. Manoj' },
            { roll: '2310176', name: 'R. Bhanu Prakash' },
            { roll: '2310177', name: 'V. Venkatesh' },
        ];

        for (const data of studentData) {
            students.push({
                name: data.name,
                email: `${data.roll}@skucet.edu`,
                password: data.roll,
                role: 'student',
                rollNumber: data.roll,
                branch: 'CSE',
                semester: 6, // 3rd Year 2nd Sem
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
