/**
 * updateFacultyNames.js
 * 
 * Updates the display name of each faculty to the proper academic name
 * so that Admin portal → Subjects section shows correct staff names.
 *
 * Email → Proper Academic Name mapping:
 *  purushothamreddy@gmail.com        → Mr. D. Purushotam Reddy  (EI)
 *  bdaLab@gmail.com                  → Smt. D. Gousiya Begum    (BDA-LAB)
 *  dhanunjaya@gmail.com              → Mr. U. Dhanunjaya        (STM)
 *  vijayamadduru23@gmail.com         → Dr. P. R. Rajesh Kumar   (CC)
 *  girinadhm@gmail.com               → Smt. D. Gousiya Begum   (BDA)
 *  swarnalathareddyn1122@gmail.com   → Smt. Chandrakala         (C&NS)
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const FACULTY_NAMES = [
    { email: 'purushothamreddy@gmail.com', name: 'Mr. D. Purushotam Reddy' },
    { email: 'bdalab@gmail.com', name: 'Smt. D. Gousiya Begum' },
    { email: 'dhanunjaya@gmail.com', name: 'Mr. U. Dhanunjaya' },
    { email: 'vijayamadduru23@gmail.com', name: 'Dr. P. R. Rajesh Kumar' },
    { email: 'girinadhm@gmail.com', name: 'Smt. D. Gousiya Begum' },
    { email: 'swarnalathareddyn1122@gmail.com', name: 'Smt. Chandrakala' },
];

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusone');
        console.log('✅ MongoDB Connected\n');

        for (const { email, name } of FACULTY_NAMES) {
            const result = await User.findOneAndUpdate(
                { email: email.toLowerCase(), role: 'faculty' },
                { $set: { name } },
                { new: true }
            );
            if (result) {
                console.log(`✅ ${email.padEnd(42)} → ${name}`);
            } else {
                console.log(`⚠️  NOT FOUND: ${email}`);
            }
        }

        console.log('\n🎉 All faculty display names updated!\n');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Fatal:', err.message);
        process.exit(1);
    }
};

run();
