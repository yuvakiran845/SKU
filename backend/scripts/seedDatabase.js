require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const Announcement = require('../models/Announcement');

const seedDatabase = async () => {
    try {
        await connectDB();

        console.log('\n🌱 Starting database seeding...\n');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Subject.deleteMany({});
        await Timetable.deleteMany({});
        await Announcement.deleteMany({});
        console.log('✅ Existing data cleared\n');

        // Create Admin
        console.log('👨‍💼 Creating admin...');
        const admin = await User.create({
            name: 'Admin User',
            email: 'sku@admin.edu',
            password: 'admin123',
            role: 'admin',
            isFirstLogin: false
        });
        console.log(`✅ Admin created: ${admin.email}\n`);

        // Create Faculty
        console.log('👨‍🏫 Creating faculty...');
        const faculty1 = await User.create({
            name: 'Dr. Rajesh Kumar',
            email: 'sku@faculty.edu',
            password: 'faculty123',
            role: 'faculty',
            employeeId: 'FAC001',
            isFirstLogin: false
        });

        const faculty2 = await User.create({
            name: 'Dr. Priya Sharma',
            email: 'priya.sharma@sku.edu',
            password: 'faculty123',
            role: 'faculty',
            employeeId: 'FAC002',
            isFirstLogin: false
        });

        const faculty3 = await User.create({
            name: 'Prof. Amit Singh',
            email: 'amit.singh@sku.edu',
            password: 'faculty123',
            role: 'faculty',
            employeeId: 'FAC003',
            isFirstLogin: false
        });

        console.log(`✅ Faculty created: 3 members\n`);

        // Create Subjects
        console.log('📚 Creating subjects...');
        const subjects = await Subject.insertMany([
            {
                code: 'CSE301',
                name: 'Data Structures',
                credits: 4,
                semester: 3,
                branch: 'CSE',
                faculty: faculty1._id
            },
            {
                code: 'CSE302',
                name: 'Database Management Systems',
                credits: 4,
                semester: 3,
                branch: 'CSE',
                faculty: faculty2._id
            },
            {
                code: 'CSE303',
                name: 'Operating Systems',
                credits: 4,
                semester: 3,
                branch: 'CSE',
                faculty: faculty3._id
            },
            {
                code: 'CSE304',
                name: 'Computer Networks',
                credits: 4,
                semester: 3,
                branch: 'CSE',
                faculty: faculty1._id
            },
            {
                code: 'CSE305',
                name: 'Software Engineering',
                credits: 3,
                semester: 3,
                branch: 'CSE',
                faculty: faculty2._id
            }
        ]);

        // Update faculty with subjects
        faculty1.subjects = [subjects[0]._id, subjects[3]._id];
        faculty2.subjects = [subjects[1]._id, subjects[4]._id];
        faculty3.subjects = [subjects[2]._id];
        await faculty1.save();
        await faculty2.save();
        await faculty3.save();

        console.log(`✅ Subjects created: ${subjects.length}\n`);

        // Create Students
        console.log('👨‍🎓 Creating students...');
        const students = [];
        for (let i = 1; i <= 50; i++) {
            const rollNumber = `2310${String(i + 100).padStart(3, '0')}`;
            students.push({
                name: `Student ${i}`,
                email: `${rollNumber}@sku.edu`,
                password: rollNumber,
                role: 'student',
                rollNumber: rollNumber,
                branch: 'CSE',
                semester: 3,
                isFirstLogin: false,
                subjects: subjects.map(s => s._id)
            });
        }

        await User.insertMany(students);
        console.log(`✅ Students created: ${students.length}\n`);

        // Create Timetable
        console.log('📅 Creating timetable...');
        const timetableSlots = [
            // Monday
            { day: 'Monday', period: 1, startTime: '09:00 AM', endTime: '10:00 AM', subject: subjects[0]._id, faculty: faculty1._id },
            { day: 'Monday', period: 2, startTime: '10:00 AM', endTime: '11:00 AM', subject: subjects[1]._id, faculty: faculty2._id },
            { day: 'Monday', period: 3, startTime: '11:15 AM', endTime: '12:15 PM', subject: subjects[2]._id, faculty: faculty3._id },
            { day: 'Monday', period: 4, startTime: '12:15 PM', endTime: '01:15 PM', subject: subjects[3]._id, faculty: faculty1._id },

            // Tuesday
            { day: 'Tuesday', period: 1, startTime: '09:00 AM', endTime: '10:00 AM', subject: subjects[4]._id, faculty: faculty2._id },
            { day: 'Tuesday', period: 2, startTime: '10:00 AM', endTime: '11:00 AM', subject: subjects[0]._id, faculty: faculty1._id },
            { day: 'Tuesday', period: 3, startTime: '11:15 AM', endTime: '12:15 PM', subject: subjects[1]._id, faculty: faculty2._id },
            { day: 'Tuesday', period: 4, startTime: '12:15 PM', endTime: '01:15 PM', subject: subjects[2]._id, faculty: faculty3._id },

            // Wednesday
            { day: 'Wednesday', period: 1, startTime: '09:00 AM', endTime: '10:00 AM', subject: subjects[3]._id, faculty: faculty1._id },
            { day: 'Wednesday', period: 2, startTime: '10:00 AM', endTime: '11:00 AM', subject: subjects[4]._id, faculty: faculty2._id },

            // Thursday
            { day: 'Thursday', period: 1, startTime: '09:00 AM', endTime: '10:00 AM', subject: subjects[1]._id, faculty: faculty2._id },
            { day: 'Thursday', period: 2, startTime: '10:00 AM', endTime: '11:00 AM', subject: subjects[2]._id, faculty: faculty3._id },
            { day: 'Thursday', period: 3, startTime: '11:15 AM', endTime: '12:15 PM', subject: subjects[3]._id, faculty: faculty1._id },
            { day: 'Thursday', period: 4, startTime: '12:15 PM', endTime: '01:15 PM', subject: subjects[4]._id, faculty: faculty2._id },

            // Friday
            { day: 'Friday', period: 1, startTime: '09:00 AM', endTime: '10:00 AM', subject: subjects[0]._id, faculty: faculty1._id },
            { day: 'Friday', period: 4, startTime: '12:15 PM', endTime: '01:15 PM', subject: subjects[2]._id, faculty: faculty3._id },

            // Saturday
            { day: 'Saturday', period: 1, startTime: '09:00 AM', endTime: '10:00 AM', subject: subjects[3]._id, faculty: faculty1._id },
            { day: 'Saturday', period: 2, startTime: '10:00 AM', endTime: '11:00 AM', subject: subjects[4]._id, faculty: faculty2._id }
        ];

        await Timetable.create({
            semester: 3,
            branch: 'CSE',
            academicYear: '2025-2026',
            slots: timetableSlots
        });

        console.log(`✅ Timetable created\n`);

        // Create Announcements
        console.log('📢 Creating announcements...');
        const announcements = [
            {
                title: 'Mid-Term Examination Schedule Released',
                message: 'The Mid-2 examination schedule has been released. Please check the notice board for detailed timings and venues.',
                targetRole: 'student',
                createdBy: admin._id,
                priority: 'high'
            },
            {
                title: 'Database Lab Cancelled - 5th Feb',
                message: 'The DBMS Lab scheduled for 5th February is cancelled due to faculty unavailability. Make-up class will be announced soon.',
                targetRole: 'student',
                subject: subjects[1]._id,
                targetSemester: 3,
                targetBranch: 'CSE',
                createdBy: faculty2._id,
                priority: 'medium'
            },
            {
                title: 'Data Structures Assignment Submission',
                message: 'Assignment on Trees and Graphs is due by 10th February. Late submissions will not be accepted.',
                targetRole: 'student',
                subject: subjects[0]._id,
                targetSemester: 3,
                targetBranch: 'CSE',
                createdBy: faculty1._id,
                priority: 'high'
            },
            {
                title: 'Guest Lecture on Cloud Computing',
                message: 'We are organizing a guest lecture on Cloud Computing and DevOps on 8th February at 2 PM in the seminar hall. All students are encouraged to attend.',
                targetRole: 'student',
                createdBy: admin._id,
                priority: 'medium'
            }
        ];

        await Announcement.insertMany(announcements);
        console.log(`✅ Announcements created: ${announcements.length}\n`);

        console.log('='.repeat(60));
        console.log('🎉 Database seeding completed successfully!');
        console.log('='.repeat(60));
        console.log('\n📋 Summary:');
        console.log(`   - Admin: 1`);
        console.log(`   - Faculty: 3`);
        console.log(`   - Students: ${students.length}`);
        console.log(`   - Subjects: ${subjects.length}`);
        console.log(`   - Timetable: 1`);
        console.log(`   - Announcements: ${announcements.length}`);
        console.log('\n📝 Login Credentials:');
        console.log('   Admin:   sku@admin.edu / admin123');
        console.log('   Faculty: sku@faculty.edu / faculty123');
        console.log('   Student: 2310101@sku.edu / 2310101');
        console.log('='.repeat(60) + '\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
