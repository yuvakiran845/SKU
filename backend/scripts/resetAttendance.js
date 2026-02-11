const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
require('dotenv').config();

const resetAttendance = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await Attendance.deleteMany({});
        console.log(`Deleted ${result.deletedCount} attendance records. All attendance reset to 0%.`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error resetting attendance:', error);
        process.exit(1);
    }
};

resetAttendance();
