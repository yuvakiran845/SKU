
const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const createSharedUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusone');
        console.log('MongoDB Connected');

        // We will reset the password to this plain text value
        // The User model's pre-save hook will handle the hashing automatically
        const rawPassword = 'FacultyPortalLogin2026';

        const emails = [
            { email: 'faculty.portal@skucet.edu', empId: 'SHARED_FACULTY' },
            { email: 'facultyportal@skucet.edu', empId: 'SHARED_FACULTY_ALT' }
        ];

        for (const { email, empId } of emails) {
            let user = await User.findOne({ email });

            if (user) {
                // UPDATE EXISTING USER
                // Set PLAIN TEXT password - let the model hash it
                user.password = rawPassword;
                user.role = 'faculty';
                user.isFirstLogin = false;
                user.employeeId = empId;
                await user.save();
                console.log(`✅ Updated user: ${email}`);
            } else {
                // CREATE NEW USER
                // Set PLAIN TEXT password
                await User.create({
                    name: 'Faculty Portal',
                    email,
                    password: rawPassword,
                    role: 'faculty',
                    isFirstLogin: false,
                    employeeId: empId,
                    isActive: true
                });
                console.log(`✅ Created user: ${email}`);
            }
        }

        console.log(`\nSUCCESS! You can now login with:\n`);
        console.log(`Email: faculty.portal@skucet.edu  OR  facultyportal@skucet.edu`);
        console.log(`Password: ${rawPassword}\n`);

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

createSharedUser();
