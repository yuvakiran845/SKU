/**
 * registerMissingFaculty.js
 *
 * Creates / updates 3 faculty accounts:
 *  1. bdaLab@gmail.com   / bdalab@098                  → BDA-LAB subject
 *  2. vijayamadduru23@gmail.com / vijaya@2306            → All subjects (shared view)
 *  3. swarnalathareddyn1122@gmail.com / swarna@123       → All subjects (shared view)
 *
 * Key constraints from User model:
 *  - registeredSubject: sparse+unique  (only ONE faculty can "own" a subject)
 *  - employeeId       : sparse+unique
 *  - email            : unique
 *
 * Strategy:
 *  - "ALL subjects" users → DON'T set registeredSubject (leave null) so there's
 *    no conflict; assign all subject IDs into the `subjects` array only.
 *  - BDA-LAB user        → only set registeredSubject if no other faculty already
 *    owns BDA-LAB; otherwise just add it to the subjects array.
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

// ── Generate a unique employeeId that doesn't already exist ──────────────────
async function safeEmployeeId(prefix) {
    let id;
    let exists = true;
    while (exists) {
        id = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
        exists = await User.findOne({ employeeId: id });
    }
    return id;
}

// ── Upsert a single faculty account ──────────────────────────────────────────
async function upsertFaculty({ name, email, password, subjectCodes, allSubjectDocs }) {
    const lowerEmail = email.toLowerCase();

    // Resolve subject ObjectIds
    const assignedSubjects = subjectCodes === 'ALL'
        ? allSubjectDocs.map(s => s._id)
        : allSubjectDocs.filter(s => subjectCodes.includes(s.code)).map(s => s._id);

    // For BDA-LAB: only claim registeredSubject if not already taken by another
    let registeredSubjectId = null;
    if (subjectCodes !== 'ALL') {
        const primarySubjectDoc = allSubjectDocs.find(s => subjectCodes[0] === s.code);
        if (primarySubjectDoc) {
            const alreadyTaken = await User.findOne({
                registeredSubject: primarySubjectDoc._id,
                email: { $ne: lowerEmail }
            });
            if (!alreadyTaken) {
                registeredSubjectId = primarySubjectDoc._id;
            } else {
                console.log(`  ⚠️  Subject ${subjectCodes[0]} already owned by another faculty — skipping registeredSubject, still adding to subjects array`);
            }
        }
    }
    // For 'ALL' accounts: leave registeredSubject null to avoid unique-key conflicts

    let user = await User.findOne({ email: lowerEmail });

    if (user) {
        // Patch existing record via findOneAndUpdate to bypass the pre-save
        // hook on fields we didn't touch, BUT we DO want to re-hash password
        // so use save() — first clear employeeId collision risk
        user.role = 'faculty';
        user.name = name;
        user.subjects = assignedSubjects;
        user.isActive = true;
        user.isFirstLogin = false;

        // Only set registeredSubject if we have one and the field wasn't already set
        if (registeredSubjectId && !user.registeredSubject) {
            user.registeredSubject = registeredSubjectId;
        }

        // Ensure employeeId exists and is unique
        if (!user.employeeId) {
            user.employeeId = await safeEmployeeId('FAC-UPD-');
        }

        // Re-hash password
        user.password = password;

        await user.save();
        console.log(`✅ UPDATED  → ${lowerEmail}`);
    } else {
        const employeeId = await safeEmployeeId('FAC-NEW-');
        await User.create({
            name,
            email: lowerEmail,
            password,
            role: 'faculty',
            subjects: assignedSubjects,
            registeredSubject: registeredSubjectId || undefined,
            employeeId,
            isActive: true,
            isFirstLogin: false
        });
        console.log(`✅ CREATED  → ${lowerEmail}`);
    }

    const label = subjectCodes === 'ALL' ? 'ALL subjects' : subjectCodes.join(', ');
    console.log(`   Subjects : ${label}`);
    console.log(`   Password : ${password}\n`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusone');
        console.log('✅ MongoDB Connected\n');

        const allSubjectDocs = await Subject.find({ isActive: true });
        if (!allSubjectDocs.length) {
            console.error('❌ No active subjects found. Seed the DB first.');
            process.exit(1);
        }

        console.log(`📚 ${allSubjectDocs.length} subjects found: ${allSubjectDocs.map(s => s.code).join(', ')}\n`);

        const accounts = [
            {
                name: 'BDA Lab Faculty',
                email: 'bdaLab@gmail.com',
                password: 'bdalab@098',
                subjectCodes: ['BDA-LAB'],   // registered for Big Data Analytics Lab only
            },
            {
                name: 'Vijaya Madduru',
                email: 'vijayamadduru23@gmail.com',
                password: 'vijaya@2306',
                subjectCodes: 'ALL',          // full shared access
            },
            {
                name: 'N. Swarna Latha',
                email: 'swarnalathareddyn1122@gmail.com',
                password: 'swarna@123',
                subjectCodes: 'ALL',          // full shared access
            },
        ];

        for (const acc of accounts) {
            await upsertFaculty({ ...acc, allSubjectDocs });
        }

        console.log('────────────────────────────────────────────────────────────');
        console.log('🎉  All 3 faculty accounts are now ready to login!');
        console.log('────────────────────────────────────────────────────────────');
        console.log('  bdaLab@gmail.com                 / bdalab@098     → BDA-LAB');
        console.log('  vijayamadduru23@gmail.com        / vijaya@2306    → All subjects');
        console.log('  swarnalathareddyn1122@gmail.com  / swarna@123     → All subjects');
        console.log('────────────────────────────────────────────────────────────\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Fatal error:', err.message);
        process.exit(1);
    }
};

run();
