
const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const fix = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusone');
        console.log('MongoDB Connected');

        // Find Timetable for CSE Sem 6
        const timetable = await Timetable.findOne({ semester: 6, branch: 'CSE' });
        if (!timetable) {
            console.log('Timetable not found!');
            return;
        }

        console.log(`Initial Slots: ${timetable.slots.length}`);

        // Remove Wednesday Period 6
        const initialCount = timetable.slots.length;
        timetable.slots = timetable.slots.filter(s => !(s.day === 'Wednesday' && s.period === 6));

        if (timetable.slots.length < initialCount) {
            console.log('Removed Wednesday Period 6 slot.');
            await timetable.save();
            console.log('Timetable updated.');
        } else {
            console.log('Wednesday Period 6 slot not found or already removed.');
        }

        console.log(`Final Slots: ${timetable.slots.length}`);

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
};

fix();
