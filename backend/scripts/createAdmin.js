
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const createAdminUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusone');
        console.log('MongoDB Connected');

        const email = 'admin.portal@skucet.edu'; // More professional email
        // Also support the seed email just in case
        const seedEmail = 'sku@admin.edu';

        const rawPassword = 'AdminPortalLogin2026';

        // 1. Check/Update Professional Admin
        let admin = await User.findOne({ email });

        if (admin) {
            admin.password = rawPassword; // Model hook will hash
            admin.role = 'admin';
            admin.isFirstLogin = false;
            await admin.save();
            console.log(`✅ Updated Admin: ${email}`);
        } else {
            await User.create({
                name: 'System Administrator',
                email,
                password: rawPassword,
                role: 'admin',
                isFirstLogin: false,
                isActive: true
            });
            console.log(`✅ Created Admin: ${email}`);
        }

        // 2. Check/Update Seed Admin (legacy support)
        let seedAdmin = await User.findOne({ email: seedEmail });
        if (seedAdmin) {
            seedAdmin.password = rawPassword;
            seedAdmin.role = 'admin';
            seedAdmin.isFirstLogin = false;
            await seedAdmin.save();
            console.log(`✅ Updated Legacy Admin: ${seedEmail}`);
        }

        console.log(`\nSUCCESS! You can login with:`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${rawPassword}\n`);

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

createAdminUser();
