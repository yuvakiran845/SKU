/**
 * resetAttendance.js
 * Run: node scripts/resetAttendance.js
 * Deletes ALL Attendance documents (sets all students to 0% for new semester)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        const result = await Attendance.deleteMany({});
        console.log(`✅ Reset complete — ${result.deletedCount} attendance records deleted.`);
        console.log('All students now show 0% attendance.');
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.connection.close();
        console.log('Connection closed.');
    }
};

run();
