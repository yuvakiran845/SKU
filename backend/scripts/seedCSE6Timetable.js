
const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const bcrypt = require('bcryptjs');

// Config
const SEMESTER = 6;
const BRANCH = 'CSE';
const ACADEMIC_YEAR = '2025-26';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusone');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seed = async () => {
    await connectDB();

    console.log('--- Seeding CSE Sem 6 Timetable ---');

    // 1. Create/Get Faculty
    const facultyList = [
        { name: 'Smt. D Gousiya Begum', email: 'gousiya@skucet.edu', role: 'faculty' },
        { name: 'Dr. P R Rajesh Kumar', email: 'rajesh@skucet.edu', role: 'faculty' },
        { name: 'Smt. R. Sumathi', email: 'sumathi@skucet.edu', role: 'faculty' },
        { name: 'Smt. Chandrakala', email: 'chandrakala@skucet.edu', role: 'faculty' },
        { name: 'Mr. U Dhanunjaya', email: 'dhanunjaya@skucet.edu', role: 'faculty' },
        { name: 'Mr. D. Purushotam Reddy', email: 'purushotam@skucet.edu', role: 'faculty' },
        { name: 'Dr. Shakila', email: 'shakila@skucet.edu', role: 'faculty' },
        { name: 'General Faculty', email: 'general@skucet.edu', role: 'faculty' } // For Lib/TPR if needed
    ];

    const facultyMap = {}; // name -> _id

    for (const f of facultyList) {
        let user = await User.findOne({ email: f.email });
        if (!user) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            user = await User.create({
                name: f.name,
                email: f.email,
                password: hashedPassword,
                role: 'faculty',
                branch: BRANCH,
                isActive: true,
                isFirstLogin: false
            });
            console.log(`Created faculty: ${f.name}`);
        } else {
            console.log(`Found faculty: ${f.name}`);
        }
        facultyMap[f.name] = user._id;
    }

    // 2. Create/Get Subjects
    const subjectsList = [
        { code: 'ML', name: 'Machine Learning', credits: 3, facultyName: 'Smt. R. Sumathi' },
        { code: 'C&NS', name: 'Cryptography & Network Security', credits: 3, facultyName: 'Smt. Chandrakala' },
        { code: 'CC', name: 'Cloud Computing', credits: 3, facultyName: 'Dr. P R Rajesh Kumar' },
        { code: 'STM', name: 'Software Testing Methodologies', credits: 3, facultyName: 'Mr. U Dhanunjaya' },
        { code: 'EI (OE-II)', name: 'Electronic Instrumentation', credits: 3, facultyName: 'Mr. D. Purushotam Reddy' },
        { code: 'BDA', name: 'Big Data Analytics', credits: 3, facultyName: 'Smt. D Gousiya Begum' },
        { code: 'BDA LAB/ML LAB', name: 'Big Data / Machine Learning Lab', credits: 2, facultyName: 'Smt. D Gousiya Begum' }, // Simplified
        { code: 'SOC LAB', name: 'SOC Skill Lab English', credits: 2, facultyName: 'Dr. Shakila' },
        { code: 'TPR', name: 'Technical Paper Writing', credits: 1, facultyName: 'General Faculty' },
        { code: 'LIB', name: 'Library / NCC / Seminar', credits: 1, facultyName: 'General Faculty' }
    ];

    const subjectMap = {}; // code -> _id

    for (const s of subjectsList) {
        let subject = await Subject.findOne({ code: s.code, semester: SEMESTER });
        const fId = facultyMap[s.facultyName] || facultyMap['General Faculty'];

        if (!subject) {
            subject = await Subject.create({
                code: s.code,
                name: s.name,
                credits: s.credits,
                semester: SEMESTER,
                branch: BRANCH,
                faculty: fId
            });
            console.log(`Created subject: ${s.code}`);
        } else {
            // Update faculty if needed
            subject.faculty = fId;
            await subject.save();
            console.log(`Updated subject: ${s.code}`);
        }
        subjectMap[s.code] = subject._id;

        // Also update faculty's subjects list
        await User.findByIdAndUpdate(fId, { $addToSet: { subjects: subject._id } });
    }

    // 3. Create Timetable
    // Clear existing for this sem
    await Timetable.deleteOne({ semester: SEMESTER, branch: BRANCH });

    const timeSlots = [
        { p: 1, start: '09:30', end: '10:30' },
        { p: 2, start: '10:30', end: '11:30' },
        { p: 3, start: '11:30', end: '12:30' },
        { p: 4, start: '01:30', end: '02:30' },
        { p: 5, start: '02:30', end: '03:30' },
        { p: 6, start: '03:30', end: '04:30' }
    ];

    const schedule = [
        // MON
        { d: 'Monday', p: 1, s: 'ML' },
        { d: 'Monday', p: 2, s: 'C&NS' },
        { d: 'Monday', p: 3, s: 'CC' },
        { d: 'Monday', p: 4, s: 'STM' },
        { d: 'Monday', p: 5, s: 'EI (OE-II)' },
        { d: 'Monday', p: 6, s: 'BDA' },

        // TUE
        { d: 'Tuesday', p: 1, s: 'STM' }, // STM(PE-II)
        { d: 'Tuesday', p: 2, s: 'C&NS' },
        { d: 'Tuesday', p: 3, s: 'ML' },
        { d: 'Tuesday', p: 4, s: 'BDA LAB/ML LAB' },
        { d: 'Tuesday', p: 5, s: 'BDA LAB/ML LAB' },
        { d: 'Tuesday', p: 6, s: 'BDA LAB/ML LAB' },

        // WED
        { d: 'Wednesday', p: 1, s: 'BDA LAB/ML LAB' },
        { d: 'Wednesday', p: 2, s: 'BDA LAB/ML LAB' },
        { d: 'Wednesday', p: 3, s: 'BDA LAB/ML LAB' },
        { d: 'Wednesday', p: 4, s: 'ML' },
        { d: 'Wednesday', p: 5, s: 'STM' },
        { d: 'Wednesday', p: 6, s: 'CC' },

        // THU
        { d: 'Thursday', p: 1, s: 'C&NS' },
        { d: 'Thursday', p: 2, s: 'CC' },
        { d: 'Thursday', p: 3, s: 'EI (OE-II)' },
        { d: 'Thursday', p: 4, s: 'BDA' },
        { d: 'Thursday', p: 5, s: 'STM' },
        { d: 'Thursday', p: 6, s: 'LIB' }, // LIBRARY/ NCC/ SEMINAR

        // FRI
        { d: 'Friday', p: 1, s: 'EI (OE-II)' },
        { d: 'Friday', p: 2, s: 'ML' },
        { d: 'Friday', p: 3, s: 'BDA' },
        { d: 'Friday', p: 4, s: 'SOC LAB' },
        { d: 'Friday', p: 5, s: 'SOC LAB' },
        { d: 'Friday', p: 6, s: 'SOC LAB' }, // Assuming 3 slots for lab

        // SAT
        { d: 'Saturday', p: 1, s: 'CC' },
        { d: 'Saturday', p: 2, s: 'EI (OE-II)' },
        { d: 'Saturday', p: 3, s: 'BDA' },
        { d: 'Saturday', p: 4, s: 'C&NS' },
        { d: 'Saturday', p: 5, s: 'TPR' }, // Technical Paper Writing
        { d: 'Saturday', p: 6, s: 'TPR' },
    ];

    const slotsData = [];
    for (const item of schedule) {
        const subjectId = subjectMap[item.s];
        if (!subjectId) {
            console.error(`Missing subject map for ${item.s}`);
            continue;
        }

        // Find faculty for this subject
        const subject = await Subject.findById(subjectId);
        const facultyId = subject.faculty;

        const timeSlot = timeSlots.find(t => t.p === item.p);

        slotsData.push({
            day: item.d,
            period: item.p,
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            subject: subjectId,
            faculty: facultyId,
            roomNumber: 'CSE-301'
        });
    }

    await Timetable.create({
        semester: SEMESTER,
        branch: BRANCH,
        academicYear: ACADEMIC_YEAR,
        slots: slotsData,
        isActive: true
    });

    console.log('Timetable seeded successfully!');
    process.exit();
};

seed();
