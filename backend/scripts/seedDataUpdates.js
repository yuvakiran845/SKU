const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');

// Use current directory for .env
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const createData = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        await mongoose.connect(uri);
        console.log('MongoDB Connected');

        // 1. Clear existing data
        await User.deleteMany({});
        await Subject.deleteMany({});
        await Timetable.deleteMany({});
        await Attendance.deleteMany({});
        console.log('Cleared existing data');

        // 2. Create Admin User
        const adminSalt = await bcrypt.genSalt(10);
        const adminPassword = await bcrypt.hash('admin123', adminSalt);

        await User.create({
            name: 'System Admin',
            email: 'admin@skucet.edu',
            password: 'admin123',
            role: 'admin',
            isActive: true,
            isFirstLogin: false
        });
        console.log('Admin User Created (admin@skucet.edu / admin123)');

        // 3. Create Subjects
        const subjectsData = [
            { code: 'ML', name: 'Machine Learning', credits: 4, semester: 6, branch: 'CSE' },
            { code: 'C&NS', name: 'Cryptography & Network Security', credits: 4, semester: 6, branch: 'CSE' },
            { code: 'CC', name: 'Cloud Computing', credits: 4, semester: 6, branch: 'CSE' },
            { code: 'STM', name: 'Software Testing Methodologies', credits: 3, semester: 6, branch: 'CSE' },
            { code: 'EI', name: 'Electronic Instrumentation (OE-II)', credits: 3, semester: 6, branch: 'CSE' },
            { code: 'BDA', name: 'Big Data Analytics', credits: 4, semester: 6, branch: 'CSE' },
            { code: 'STM-LAB', name: 'Software Testing Methodologies Lab', credits: 2, semester: 6, branch: 'CSE' },
            { code: 'BDA-LAB', name: 'Big Data Analytics Lab', credits: 2, semester: 6, branch: 'CSE' },
            { code: 'ML-LAB', name: 'Machine Learning Lab', credits: 2, semester: 6, branch: 'CSE' },
            { code: 'SOC', name: 'SOC Skill Lab', credits: 1, semester: 6, branch: 'CSE' },
            { code: 'TPR', name: 'Technical Paper Writing', credits: 1, semester: 6, branch: 'CSE' },
            { code: 'LIB', name: 'Library', credits: 1, semester: 6, branch: 'CSE' } // Minimum credits 1
        ];

        const createdSubjects = await Subject.insertMany(subjectsData);
        console.log(`Created ${createdSubjects.length} Subjects`);

        const getSubId = (code) => {
            const sub = createdSubjects.find(s => s.code === code);
            if (!sub) throw new Error(`Subject with code ${code} not found in created subjects`);
            return sub._id;
        };

        // 4. Create Faculty
        const facultyData = [
            { name: 'Smt. D Gousiya Begum', email: 'gousiya@skucet.edu', subjects: ['BDA', 'BDA-LAB', 'TPR'] },
            { name: 'Dr. P R Rajesh Kumar', email: 'rajesh@skucet.edu', subjects: ['CC', 'LIB'] },
            { name: 'Smt. R. Sumathi', email: 'sumathi@skucet.edu', subjects: ['ML', 'ML-LAB'] },
            { name: 'Smt. Chandrakala', email: 'chandrakala@skucet.edu', subjects: ['C&NS'] },
            { name: 'Mr. U Dhanunjaya', email: 'dhanunjaya@skucet.edu', subjects: ['STM'] },
            { name: 'Dr. Shakila', email: 'shakila@skucet.edu', subjects: ['SOC'] },
            { name: 'Mr. D. Purushotam Reddy', email: 'purushotam@skucet.edu', subjects: ['EI'] }
        ];

        const createdFaculty = [];
        for (const fac of facultyData) {
            const subjectIds = fac.subjects.map(code => getSubId(code));

            const newFaculty = await User.create({
                name: fac.name,
                email: fac.email,
                role: 'faculty',
                password: 'password123', // Will be hashed by pre-save
                isFirstLogin: false,
                employeeId: 'FAC' + Math.floor(1000 + Math.random() * 9000),
                subjects: subjectIds
            });

            // Update subjects with faculty ref
            await Subject.updateMany(
                { _id: { $in: subjectIds } },
                { $set: { faculty: newFaculty._id } }
            );

            createdFaculty.push(newFaculty);
        }
        console.log(`Created ${createdFaculty.length} Faculty`);

        const getFacId = (namePart) => {
            const fac = createdFaculty.find(f => f.name.includes(namePart));
            if (!fac) {
                console.warn(`Warning: Faculty with name part '${namePart}' not found, using first available.`);
                return createdFaculty[0]._id;
            }
            return fac._id;
        };

        // 5. Create Students
        const studentList = [
            { roll: '2310101', name: 'A. Lochan Kumar' },
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
            { roll: '2310138', name: 'P. Ankatha' },
            { roll: '2310139', name: 'P. Aparna' },
            { roll: '2310140', name: 'P. Sravani' },
            { roll: '2310141', name: 'P. Susmitha Das' },
            { roll: '2310142', name: 'P. Bhavya Sree' },
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
            { roll: '2310160', name: 'V. Sai Priya' },
            { roll: '2310171', name: 'C. Kavya' },
            { roll: '2310172', name: 'D. Deekshitha' },
            { roll: '2310173', name: 'D. Hareesh' },
            { roll: '2310174', name: 'G. Vamsi Madhukar' },
            { roll: '2310175', name: 'M. Manoj' },
            { roll: '2310176', name: 'R. Bhanu Prakash' },
            { roll: '2310177', name: 'V. Venkatesh' }
        ];

        // Batch create students for performance or loop
        let createdStudentCount = 0;
        for (const student of studentList) {
            try {
                await User.create({
                    name: student.name,
                    email: `${student.roll}@skucet.edu`,
                    password: student.roll,
                    role: 'student',
                    isFirstLogin: false,
                    rollNumber: student.roll,
                    branch: 'CSE',
                    semester: 6
                });
                createdStudentCount++;
            } catch (err) {
                console.error(`Failed to create student ${student.roll}:`, err.message);
            }
        }
        console.log(`Created ${createdStudentCount} Students`);

        // 6. Create Timetable
        const timeSlots = [
            { id: 1, start: '09:30 AM', end: '10:30 AM' },
            { id: 2, start: '10:30 AM', end: '11:30 AM' },
            { id: 3, start: '11:30 AM', end: '12:30 PM' },
            { id: 4, start: '01:30 PM', end: '02:30 PM' },
            { id: 5, start: '02:30 PM', end: '03:30 PM' },
            { id: 6, start: '03:30 PM', end: '04:30 PM' }
        ];

        const timetableData = [
            // MON (Based on image)
            { day: 'Monday', period: 1, subject: getSubId('ML'), faculty: getFacId('Sumathi') },
            { day: 'Monday', period: 2, subject: getSubId('C&NS'), faculty: getFacId('Chandrakala') },
            { day: 'Monday', period: 3, subject: getSubId('CC'), faculty: getFacId('Rajesh') },
            { day: 'Monday', period: 4, subject: getSubId('STM'), faculty: getFacId('Dhanunjaya') },
            { day: 'Monday', period: 5, subject: getSubId('EI'), faculty: getFacId('Purushotam') },
            { day: 'Monday', period: 6, subject: getSubId('BDA'), faculty: getFacId('Gousiya') },

            // TUE
            { day: 'Tuesday', period: 1, subject: getSubId('STM'), faculty: getFacId('Dhanunjaya') }, // STM(PE-II)
            { day: 'Tuesday', period: 2, subject: getSubId('C&NS'), faculty: getFacId('Chandrakala') },
            { day: 'Tuesday', period: 3, subject: getSubId('ML'), faculty: getFacId('Sumathi') },
            { day: 'Tuesday', period: 4, subject: getSubId('BDA-LAB'), faculty: getFacId('Gousiya') }, // BDA LAB / ML LAB
            { day: 'Tuesday', period: 5, subject: getSubId('BDA-LAB'), faculty: getFacId('Gousiya') },
            { day: 'Tuesday', period: 6, subject: getSubId('CC'), faculty: getFacId('Rajesh') },

            // WED
            { day: 'Wednesday', period: 1, subject: getSubId('BDA-LAB'), faculty: getFacId('Gousiya') }, // BDA LAB / ML LAB
            { day: 'Wednesday', period: 2, subject: getSubId('BDA-LAB'), faculty: getFacId('Gousiya') },
            { day: 'Wednesday', period: 3, subject: getSubId('ML'), faculty: getFacId('Sumathi') }, // Image says ML
            { day: 'Wednesday', period: 4, subject: getSubId('ML'), faculty: getFacId('Sumathi') }, // Wait, image says ML for 3rd, STM 4th? No image says ML 3rd. 
            // Checking image: Wed: BDA/ML LAB -> ML -> STM -> CC.
            // B1/B2 split usually means 1-2 periods are lab. 
            // Assuming periods 1-2: Lab. Perio 3: ML. Period 4: STM. Period 5: CC
            // Wait, standard is usually 6 periods?
            // Image shows:
            // MON: ML, C&NS, CC, STM, EI, BDA
            // TUE: STM, C&NS, ML, BDA/ML LAB
            // WED: BDA/ML LAB, ML, STM, CC
            // THU: C&NS, CC, EI, BDA, STM, LIB
            // FRI: EI, ML, BDA, SOC SKILL LAB
            // SAT: CC, EI, BDA, C&NS, TPR

            // Reworking WED based on 6 slots assumption and image visual block size
            // WED 1-2: LAB (BDA/ML)
            // WED 3: ML
            // WED 4: STM
            // WED 5: CC
            // WED 6: ? Maybe Empty or Sports?
            // Re-reading image for Wednesday:
            // 9.30-10.30: BDA LAB / ML LAB
            // 10.30-11.30: BDA LAB / ML LAB (Spans two columns?) Yes.
            // 11.30-12.30: ML (Matches period 3)
            // 1.30-2.30: STM (Matches period 4)
            // 2.30-3.30: CC (Matches period 5)
            // 3.30-4.30: ? (Empty in my read? Or maybe seminar?)
            // Let's stick to what I had or refine.
            // The previous code had:
            // { day: 'Wednesday', period: 3, subject: getSubId('ML')... }
            // { day: 'Wednesday', period: 4, subject: getSubId('ML')... } -> Wait, I put ML twice. Should be STM in period 4?
            // Image: Wed 1.30-2.30 is ML?
            // No, look closely at Wed row.
            // Col 1 (9.30): BDA LAB
            // Col 2 (10.30): BDA LAB
            // Col 3 (11.30): ML
            // Col 4 (1.30): STM
            // Col 5 (2.30): CC
            // Col 6 (3.30): PE-III? No, text under Faculty column.

            // Wait, let's look at the columns:
            // 9.30, 10.30, 11.30, 1.30, 2.30, 3.30
            // Wed:
            // 1 & 2: Lab
            // 3: ML
            // 4: STM
            // 5: CC
            // 6: ? (Maybe empty? or Library?) Let's put LIB
            { day: 'Wednesday', period: 4, subject: getSubId('STM'), faculty: getFacId('Dhanunjaya') },
            { day: 'Wednesday', period: 5, subject: getSubId('CC'), faculty: getFacId('Rajesh') },
            { day: 'Wednesday', period: 6, subject: getSubId('LIB'), faculty: getFacId('Rajesh') },

            // THU
            { day: 'Thursday', period: 1, subject: getSubId('C&NS'), faculty: getFacId('Chandrakala') },
            { day: 'Thursday', period: 2, subject: getSubId('CC'), faculty: getFacId('Rajesh') },
            { day: 'Thursday', period: 3, subject: getSubId('EI'), faculty: getFacId('Purushotam') },
            { day: 'Thursday', period: 4, subject: getSubId('BDA'), faculty: getFacId('Gousiya') },
            { day: 'Thursday', period: 5, subject: getSubId('STM'), faculty: getFacId('Dhanunjaya') },
            { day: 'Thursday', period: 6, subject: getSubId('LIB'), faculty: getFacId('Rajesh') },

            // FRI
            { day: 'Friday', period: 1, subject: getSubId('EI'), faculty: getFacId('Purushotam') },
            { day: 'Friday', period: 2, subject: getSubId('ML'), faculty: getFacId('Sumathi') },
            { day: 'Friday', period: 3, subject: getSubId('BDA'), faculty: getFacId('Gousiya') },
            { day: 'Friday', period: 4, subject: getSubId('SOC'), faculty: getFacId('Shakila') },
            { day: 'Friday', period: 5, subject: getSubId('SOC'), faculty: getFacId('Shakila') },
            { day: 'Friday', period: 6, subject: getSubId('SOC'), faculty: getFacId('Shakila') },

            // SAT
            { day: 'Saturday', period: 1, subject: getSubId('CC'), faculty: getFacId('Rajesh') },
            { day: 'Saturday', period: 2, subject: getSubId('EI'), faculty: getFacId('Purushotam') },
            { day: 'Saturday', period: 3, subject: getSubId('BDA'), faculty: getFacId('Gousiya') },
            { day: 'Saturday', period: 4, subject: getSubId('C&NS'), faculty: getFacId('Chandrakala') },
            { day: 'Saturday', period: 5, subject: getSubId('TPR'), faculty: getFacId('Gousiya') }, // Using Gousiya for TPR as well since she leads BDA? Or assign to someone else.
            { day: 'Saturday', period: 6, subject: getSubId('TPR'), faculty: getFacId('Gousiya') }
        ];

        const formattedSlots = [];
        for (const slot of timetableData) {
            const timeSlot = timeSlots.find(t => t.id === slot.period);
            formattedSlots.push({
                day: slot.day,
                period: slot.period,
                startTime: timeSlot.start,
                endTime: timeSlot.end,
                subject: slot.subject,
                faculty: slot.faculty,
                roomNumber: 'CS-302'
            });
        }

        await Timetable.create({
            semester: 6,
            branch: 'CSE',
            academicYear: '2025-26',
            slots: formattedSlots
        });
        console.log('Timetable Created');

        console.log('Seed Complete');
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    }
};

createData();
