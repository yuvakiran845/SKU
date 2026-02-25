const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const fixStudentName = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusone');
        console.log('✅ MongoDB Connected');

        const result = await User.findOneAndUpdate(
            { rollNumber: '2310142', role: 'student' },
            { $set: { name: 'P. Bhavya Sree' } },
            { new: true }
        );

        if (result) {
            console.log(`✅ Updated name for roll 2310142:`);
            console.log(`   Old: P. Bharya Sree`);
            console.log(`   New: ${result.name}`);
        } else {
            console.log('❌ Student with roll 2310142 not found.');
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

fixStudentName();
