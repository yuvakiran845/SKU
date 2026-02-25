/**
 * setupDefinitiveFaculty.js
 *
 * REPLACES all existing faculty accounts with the 6 definitive credentials below.
 * Any old named-faculty / shared-portal accounts are removed.
 * Subjects with no assigned email (ML, SOC, LIB, TPR) are left open for
 * self-registration via the Faculty Register page.
 *
 * Definitive mapping:
 *  purushothamreddy@gmail.com  / purushotham@098  → EI   (Electronic Instrumentation)
 *  bdaLab@gmail.com            / bdalab@098        → BDA-LAB (Big Data Analytics Lab)
 *  dhanunjaya@gmail.com        / dhanunjaya@098    → STM  (Software Testing Methodologies)
 *  vijayamadduru23@gmail.com   / vijaya@2306       → CC   (Cloud Computing)
 *  girinadhm@gmail.com         / girinadh@2632     → BDA  (Big Data Analytics)
 *  swarnalathareddyn1122@gmail.com / swarna@123    → C&NS (Cryptography & Network Security)
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

// ── Definitive faculty list ───────────────────────────────────────────────────
const DEFINITIVE_FACULTY = [
    {
        name: 'D. Purushotam Reddy',
        email: 'purushothamreddy@gmail.com',
        password: 'purushotham@098',
        subjectCode: 'EI',
    },
    {
        name: 'BDA Lab Faculty',
        email: 'bdaLab@gmail.com',
        password: 'bdalab@098',
        subjectCode: 'BDA-LAB',
    },
    {
        name: 'U. Dhanunjaya',
        email: 'dhanunjaya@gmail.com',
        password: 'dhanunjaya@098',
        subjectCode: 'STM',
    },
    {
        name: 'Vijaya Madduru',
        email: 'vijayamadduru23@gmail.com',
        password: 'vijaya@2306',
        subjectCode: 'CC',
    },
    {
        name: 'Girinadh M',
        email: 'girinadhm@gmail.com',
        password: 'girinadh@2632',
        subjectCode: 'BDA',
    },
    {
        name: 'N. Swarna Latha',
        email: 'swarnalathareddyn1122@gmail.com',
        password: 'swarna@123',
        subjectCode: 'C&NS',
    },
];

const DEFINITIVE_EMAILS = DEFINITIVE_FACULTY.map(f => f.email.toLowerCase());

// ── Unique employee ID generator ──────────────────────────────────────────────
async function safeEmployeeId(hint) {
    let id, exists = true;
    while (exists) {
        id = `FAC-${hint}-${Math.floor(1000 + Math.random() * 9000)}`;
        exists = await User.findOne({ employeeId: id });
    }
    return id;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusone');
        console.log('✅ MongoDB Connected\n');

        // ── STEP 1: Remove ALL faculty accounts NOT in the definitive list ────
        console.log('🗑️  Removing redundant faculty accounts...');
        const deleted = await User.deleteMany({
            role: 'faculty',
            email: { $nin: DEFINITIVE_EMAILS }
        });
        console.log(`   → Removed ${deleted.deletedCount} old/redundant faculty account(s)\n`);

        // ── STEP 2: Load all subjects ─────────────────────────────────────────
        const allSubjects = await Subject.find({ isActive: true });
        const subjectMap = {};
        for (const s of allSubjects) subjectMap[s.code] = s;

        // ── STEP 3: Upsert each definitive faculty account ────────────────────
        console.log('✨ Setting up definitive faculty accounts...\n');

        for (const fac of DEFINITIVE_FACULTY) {
            const lowerEmail = fac.email.toLowerCase();
            const subject = subjectMap[fac.subjectCode];

            if (!subject) {
                console.warn(`   ⚠️  Subject "${fac.subjectCode}" not found — skipping ${lowerEmail}`);
                continue;
            }

            // Clear registeredSubject ownership from any OTHER faculty first (unique index)
            await User.updateMany(
                {
                    registeredSubject: subject._id,
                    email: { $ne: lowerEmail }
                },
                { $unset: { registeredSubject: '' } }
            );

            let user = await User.findOne({ email: lowerEmail });

            if (user) {
                user.role = 'faculty';
                user.name = fac.name;
                user.password = fac.password;   // pre-save hook re-hashes
                user.subjects = [subject._id];
                user.registeredSubject = subject._id;
                user.isActive = true;
                user.isFirstLogin = false;
                if (!user.employeeId) user.employeeId = await safeEmployeeId(fac.subjectCode);
                await user.save();
                console.log(`   ✅ UPDATED  ${lowerEmail}  →  ${subject.name} (${subject.code})`);
            } else {
                await User.create({
                    name: fac.name,
                    email: lowerEmail,
                    password: fac.password,
                    role: 'faculty',
                    subjects: [subject._id],
                    registeredSubject: subject._id,
                    employeeId: await safeEmployeeId(fac.subjectCode),
                    isActive: true,
                    isFirstLogin: false,
                });
                console.log(`   ✅ CREATED  ${lowerEmail}  →  ${subject.name} (${subject.code})`);
            }

            // Update Subject.faculty pointer to this user
            const updatedUser = await User.findOne({ email: lowerEmail });
            await Subject.findByIdAndUpdate(subject._id, { faculty: updatedUser._id });
        }

        // ── STEP 4: Print final summary ───────────────────────────────────────
        console.log('\n' + '═'.repeat(72));
        console.log('🎉  FACULTY PORTAL — DEFINITIVE CREDENTIALS');
        console.log('═'.repeat(72));
        console.log('  #  Email                              Password         Subject');
        console.log('─'.repeat(72));

        const rows = [
            ['1', 'purushothamreddy@gmail.com', 'purushotham@098', 'EI   — Electronic Instrumentation'],
            ['2', 'bdaLab@gmail.com', 'bdalab@098', 'BDA-LAB — Big Data Analytics Lab'],
            ['3', 'dhanunjaya@gmail.com', 'dhanunjaya@098', 'STM  — Software Testing Methods'],
            ['4', 'vijayamadduru23@gmail.com', 'vijaya@2306', 'CC   — Cloud Computing'],
            ['5', 'girinadhm@gmail.com', 'girinadh@2632', 'BDA  — Big Data Analytics'],
            ['6', 'swarnalathareddyn1122@gmail.com', 'swarna@123', 'C&NS — Cryptography & Net. Sec.'],
        ];
        rows.forEach(([n, e, p, s]) =>
            console.log(`  ${n}  ${e.padEnd(35)} ${p.padEnd(18)} ${s}`)
        );
        console.log('─'.repeat(72));
        console.log('  Unassigned (ML, SOC, LIB, TPR) → open for self-registration');
        console.log('═'.repeat(72) + '\n');

        await mongoose.disconnect();
        process.exit(0);

    } catch (err) {
        console.error('❌ Fatal:', err.message);
        process.exit(1);
    }
};

run();
