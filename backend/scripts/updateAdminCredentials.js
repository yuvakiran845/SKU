const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const updateAdminCredentials = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusone');
        console.log('✅ MongoDB Connected');

        const TARGET_EMAIL = 'admin.portal@skucet.edu';
        const TARGET_PASSWORD = 'AdminPortalLogin2026';

        // --- Remove any old admin accounts with different emails ---
        const oldAdminEmails = ['vijayamadduru23@gmail.com', 'sku@admin.edu'];
        for (const oldEmail of oldAdminEmails) {
            const old = await User.findOne({ email: oldEmail, role: 'admin' });
            if (old) {
                await User.deleteOne({ _id: old._id });
                console.log(`🗑️  Removed old admin: ${oldEmail}`);
            }
        }

        // --- Upsert admin with the portal credentials ---
        let admin = await User.findOne({ email: TARGET_EMAIL });
        if (admin) {
            admin.password = TARGET_PASSWORD; // pre-save hook will hash it
            admin.role = 'admin';
            admin.isFirstLogin = false;
            admin.isActive = true;
            admin.name = 'System Admin';
            await admin.save();
            console.log(`✅ Updated existing admin → ${TARGET_EMAIL}`);
        } else {
            await User.create({
                name: 'System Admin',
                email: TARGET_EMAIL,
                password: TARGET_PASSWORD,
                role: 'admin',
                isFirstLogin: false,
                isActive: true
            });
            console.log(`✅ Created new admin → ${TARGET_EMAIL}`);
        }

        console.log('\n🎉 Admin credentials are now:');
        console.log(`   Email   : ${TARGET_EMAIL}`);
        console.log(`   Password: ${TARGET_PASSWORD}\n`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

updateAdminCredentials();
