
const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const updateAdminCredentials = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusone');
        console.log('MongoDB Connected');

        // New admin credentials
        const newEmail = 'vijayamadduru23@gmail.com';
        const newPassword = 'vijaya@2306';

        // Old admin emails to find and update/replace
        const oldEmails = ['admin.portal@skucet.edu', 'sku@admin.edu'];

        // Remove old admin accounts
        for (const oldEmail of oldEmails) {
            const old = await User.findOne({ email: oldEmail });
            if (old) {
                await User.deleteOne({ email: oldEmail });
                console.log(`🗑️  Removed old admin: ${oldEmail}`);
            }
        }

        // Check if new email already exists
        let admin = await User.findOne({ email: newEmail });

        if (admin) {
            // Update existing
            admin.password = newPassword; // pre-save hook will hash
            admin.role = 'admin';
            admin.isFirstLogin = false;
            admin.isActive = true;
            admin.name = 'System Admin';
            await admin.save();
            console.log(`✅ Updated Admin: ${newEmail}`);
        } else {
            // Create new admin
            await User.create({
                name: 'System Admin',
                email: newEmail,
                password: newPassword,
                role: 'admin',
                isFirstLogin: false,
                isActive: true
            });
            console.log(`✅ Created Admin: ${newEmail}`);
        }

        console.log(`\n✅ SUCCESS! Admin credentials updated:`);
        console.log(`   Email: ${newEmail}`);
        console.log(`   Password: ${newPassword}\n`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

updateAdminCredentials();
