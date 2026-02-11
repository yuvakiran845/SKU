
const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');
const Subject = require('../models/Subject');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusone');
        console.log('MongoDB Connected');

        // Check Timetable
        const timetables = await Timetable.find({ branch: 'CSE', semester: 6 }).populate('slots.subject');

        console.log(`Found ${timetables.length} Timetables for CSE Sem 6`);

        if (timetables.length > 0) {
            const tt = timetables[0];
            console.log(`Timetable ID: ${tt._id}, Active: ${tt.isActive}`);
            console.log(`Slots: ${tt.slots.length}`);
            if (tt.slots.length > 0) {
                console.log('Sample Slot 1:', JSON.stringify(tt.slots[0], null, 2));
            }
        } else {
            console.log('NO TIMETTABLE FOUND!');
        }

        // Check Student User
        const student = await User.findOne({ email: 'student@skucet.edu' }); // Or generic student query
        if (student) {
            console.log(`Found Student: ${student.email}, Branch: ${student.branch}, Sem: ${student.semester}`);
        } else {
            // Find ANY student
            const anyStudent = await User.findOne({ role: 'student' });
            if (anyStudent) {
                console.log(`Found ANY Student: ${anyStudent.email}, Branch: ${anyStudent.branch}, Sem: ${anyStudent.semester}`);
            } else {
                console.log('NO STUDENT FOUND!');
            }
        }

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
};

check();
