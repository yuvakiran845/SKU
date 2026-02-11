const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Subject = require('../models/Subject');
require('dotenv').config();

const seedStudentsAndSubjects = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB');

        // Step 1: Create/Update Subjects based on timetable
        const subjectsData = [
            { code: 'BDA', name: 'Big Data Analytics', semester: 3, year: 2, branch: 'CSE' },
            { code: 'ML', name: 'Machine Learning', semester: 3, year: 2, branch: 'CSE' },
            { code: 'C&NS', name: 'Cryptography and Network Security', semester: 3, year: 2, branch: 'CSE' },
            { code: 'CC', name: 'Cloud Computing', semester: 3, year: 2, branch: 'CSE' },
            { code: 'STM', name: 'Software Testing Methodologies', semester: 3, year: 2, branch: 'CSE' },
            { code: 'EI', name: 'Electronic Instrumentation', semester: 3, year: 2, branch: 'CSE' },
            { code: 'SOC Lab', name: 'SOC Skill Lab English', semester: 3, year: 2, branch: 'CSE' }
        ];

        console.log('\n📚 Creating/Updating Subjects...');

        const subjectIds = [];
        for (const subData of subjectsData) {
            const subject = await Subject.findOneAndUpdate(
                { code: subData.code, branch: subData.branch },
                subData,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            subjectIds.push(subject._id);
            console.log(`  ✅ ${subData.code}: ${subData.name}`);
        }

        // Step 2: Create 50 students: 2310101 to 2310150
        console.log('\n👨‍🎓 Creating Students...');

        const students = [];

        for (let i = 1; i <= 50; i++) {
            const rollNumber = `231010${i.toString().padStart(2, '0')}`;
            const hashedPassword = await bcrypt.hash(rollNumber, 10);

            const student = {
                name: `Student ${rollNumber}`,
                email: `${rollNumber}@sku.edu`,
                password: hashedPassword,
                role: 'student',
                rollNumber: rollNumber,
                branch: 'CSE',
                semester: 3,
                year: 2,
                isFirstLogin: true,
                subjects: subjectIds // Assign all subjects to each student
            };

            students.push(student);
        }

        // Delete existing students (2310101-2310150)
        await User.deleteMany({
            rollNumber: { $regex: /^231010[0-9]{2}$/ }
        });
        console.log('🗑️  Cleared existing students');

        // Insert all students
        const result = await User.insertMany(students);
        console.log(`✅ Successfully created ${result.length} students!`);

        // Display summary
        console.log('\n' + '='.repeat(60));
        console.log('📋 DATABASE SEEDING COMPLETE!');
        console.log('='.repeat(60));

        console.log('\n📚 SUBJECTS CREATED:');
        subjectsData.forEach(sub => {
            console.log(`  • ${sub.code} - ${sub.name}`);
        });

        console.log('\n�‍🎓 STUDENT CREDENTIALS:');
        console.log('  Format: Roll Number = Email = Password');
        console.log('  ----------------------------------------');
        console.log('  2310101 → 2310101@sku.edu → 2310101');
        console.log('  2310102 → 2310102@sku.edu → 2310102');
        console.log('  ...');
        console.log('  2310150 → 2310150@sku.edu → 2310150');

        console.log('\n🔐 SECURITY NOTES:');
        console.log('  • All students MUST change password on first login');
        console.log('  • Default password = Roll number');
        console.log('  • All students assigned to CSE Branch, Year 2, Semester 3');

        console.log('\n' + '='.repeat(60));
        console.log('✅ Ready to test attendance system!');
        console.log('='.repeat(60) + '\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedStudentsAndSubjects();
