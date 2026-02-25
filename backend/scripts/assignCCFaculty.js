/**
 * assignCCFaculty.js
 *
 * Sets vijayamadduru23@gmail.com as the Cloud Computing (CC) faculty:
 *  - registeredSubject → CC subject ObjectId  (used by /api/faculty/my-subject)
 *  - subjects array    → [CC subject ObjectId] (used by timetable + profile)
 *  - password          → vijaya@2306 (re-applied in case it was changed)
 *  - role              → faculty (ensure it's correct)
 *
 * Also clears this registeredSubject from any OTHER faculty account that may
 * currently own it (to avoid the unique-index conflict).
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusone');
        console.log('✅ MongoDB Connected\n');

        // ── 1. Find the CC subject ────────────────────────────────────────────
        const ccSubject = await Subject.findOne({ code: 'CC', isActive: true });
        if (!ccSubject) {
            console.error('❌ CC (Cloud Computing) subject not found in the database.');
            process.exit(1);
        }
        console.log(`📚 Found: ${ccSubject.name} (${ccSubject.code})  id=${ccSubject._id}\n`);

        // ── 2. Remove registeredSubject=CC from any other faculty (unique constraint) ──
        const currentOwner = await User.findOne({
            registeredSubject: ccSubject._id,
            email: { $ne: 'vijayamadduru23@gmail.com' }
        });
        if (currentOwner) {
            await User.findByIdAndUpdate(currentOwner._id, {
                $unset: { registeredSubject: '' }
            });
            console.log(`🔓 Cleared registeredSubject=CC from: ${currentOwner.email}`);
        }

        // ── 3. Find or create vijayamadduru23 ────────────────────────────────
        let faculty = await User.findOne({ email: 'vijayamadduru23@gmail.com' });

        if (faculty) {
            // Update all relevant fields; re-set password so the pre-save hook re-hashes it
            faculty.role = 'faculty';
            faculty.name = faculty.name || 'Vijaya Madduru';
            faculty.subjects = [ccSubject._id];
            faculty.registeredSubject = ccSubject._id;
            faculty.isActive = true;
            faculty.isFirstLogin = false;
            faculty.password = 'vijaya@2306';          // re-hash via pre-save hook
            if (!faculty.employeeId) faculty.employeeId = 'FAC-CC-001';
            await faculty.save();
            console.log(`✅ UPDATED  → vijayamadduru23@gmail.com`);
        } else {
            // Create fresh
            faculty = await User.create({
                name: 'Vijaya Madduru',
                email: 'vijayamadduru23@gmail.com',
                password: 'vijaya@2306',
                role: 'faculty',
                subjects: [ccSubject._id],
                registeredSubject: ccSubject._id,
                employeeId: 'FAC-CC-001',
                isActive: true,
                isFirstLogin: false
            });
            console.log(`✅ CREATED  → vijayamadduru23@gmail.com`);
        }

        // ── 4. Make sure the CC Subject's faculty pointer is correct ─────────
        await Subject.findByIdAndUpdate(ccSubject._id, { faculty: faculty._id });
        console.log(`🔗 CC Subject faculty pointer updated → ${faculty.name}\n`);

        console.log('────────────────────────────────────────────────────────────');
        console.log('🎉  CC Faculty login is ready!');
        console.log('────────────────────────────────────────────────────────────');
        console.log('  Email   : vijayamadduru23@gmail.com');
        console.log('  Password: vijaya@2306');
        console.log('  Subject : Cloud Computing (CC)');
        console.log('  Portal  : Faculty → will show all CC students & attendance');
        console.log('────────────────────────────────────────────────────────────\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Fatal error:', err.message);
        process.exit(1);
    }
};

run();
