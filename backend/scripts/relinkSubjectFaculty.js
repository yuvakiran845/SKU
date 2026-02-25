/**
 * relinkSubjectFaculty.js
 *
 * Re-points every Subject.faculty → the correct currently-registered faculty User.
 * Also re-links Timetable slot faculty fields for the assigned subjects.
 *
 * Mapping (subject code → faculty email):
 *   BDA     → girinadhm@gmail.com         (Smt. D. Gousiya Begum)
 *   BDA-LAB → bdaLab@gmail.com            (Smt. D. Gousiya Begum)
 *   C&NS    → swarnalathareddyn1122@gmail.com  (Smt. Chandrakala)
 *   CC      → vijayamadduru23@gmail.com   (Dr. P. R. Rajesh Kumar)
 *   EI      → purushothamreddy@gmail.com  (Mr. D. Purushotam Reddy)
 *   STM     → dhanunjaya@gmail.com        (Mr. U. Dhanunjaya)
 *
 *   ML, ML-LAB, SOC, LIB, TPR → no current faculty (leave null / TBA)
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const SUBJECT_FACULTY_MAP = [
    { code: 'BDA', email: 'girinadhm@gmail.com' },
    { code: 'BDA-LAB', email: 'bdalab@gmail.com' },
    { code: 'C&NS', email: 'swarnalathareddyn1122@gmail.com' },
    { code: 'CC', email: 'vijayamadduru23@gmail.com' },
    { code: 'EI', email: 'purushothamreddy@gmail.com' },
    { code: 'STM', email: 'dhanunjaya@gmail.com' },
    // ML, ML-LAB, SOC, LIB, TPR  → null (open for registration)
];

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusone');
        console.log('✅ MongoDB Connected\n');

        // ── Build email → User lookup ─────────────────────────────────────────
        const emails = SUBJECT_FACULTY_MAP.map(m => m.email.toLowerCase());
        const users = await User.find({ email: { $in: emails }, role: 'faculty' });
        const userByEmail = {};
        for (const u of users) userByEmail[u.email.toLowerCase()] = u;

        // ── Update each Subject.faculty pointer ───────────────────────────────
        console.log('📚 Relinking Subject → Faculty...\n');
        const subjectIdByCode = {};

        for (const { code, email } of SUBJECT_FACULTY_MAP) {
            const faculty = userByEmail[email.toLowerCase()];
            if (!faculty) {
                console.warn(`   ⚠️  Faculty not found for email: ${email}`);
                continue;
            }
            const result = await Subject.findOneAndUpdate(
                { code, isActive: true },
                { $set: { faculty: faculty._id } },
                { new: true }
            );
            if (result) {
                subjectIdByCode[code] = result._id;
                console.log(`   ✅ ${code.padEnd(8)} → ${faculty.name} (${faculty.email})`);
            } else {
                console.warn(`   ⚠️  Subject ${code} not found in DB`);
            }
        }

        // Unset faculty for unassigned subjects (use $unset to avoid null validation issues)
        const unassignedCodes = ['ML', 'ML-LAB', 'SOC', 'LIB', 'TPR'];
        for (const code of unassignedCodes) {
            await Subject.findOneAndUpdate(
                { code, isActive: true },
                { $unset: { faculty: '' } }
            );
        }
        console.log(`\n   ℹ️  Unset faculty for: ${unassignedCodes.join(', ')} (open for self-registration)\n`);

        // ── Update Timetable slot faculty pointers via direct MongoDB update ──
        console.log('📅 Relinking Timetable slots...\n');
        const timetable = await Timetable.findOne({ isActive: true });
        if (!timetable) {
            console.warn('   ⚠️  No active timetable found — skipping slot update');
        } else {
            // Load all subjects to build subjectId → faculty mapping
            const allSubjects = await Subject.find({ isActive: true });
            const facultyBySubjectId = {};
            for (const subj of allSubjects) {
                const mapping = SUBJECT_FACULTY_MAP.find(m => m.code === subj.code);
                if (mapping) {
                    const fac = userByEmail[mapping.email.toLowerCase()];
                    if (fac) facultyBySubjectId[subj._id.toString()] = fac._id;
                }
            }

            let updated = 0;
            let cleared = 0;

            // Use direct updateOne with arrayFilters for each slot — avoids full save() validation
            for (const slot of timetable.slots) {
                const subjId = slot.subject?.toString();
                if (!subjId) continue;

                if (facultyBySubjectId[subjId]) {
                    // Re-link to correct faculty
                    await Timetable.updateOne(
                        { _id: timetable._id, 'slots._id': slot._id },
                        { $set: { 'slots.$.faculty': facultyBySubjectId[subjId] } }
                    );
                    updated++;
                } else {
                    // Unassigned — unset faculty from slot
                    await Timetable.updateOne(
                        { _id: timetable._id, 'slots._id': slot._id },
                        { $unset: { 'slots.$.faculty': '' } }
                    );
                    cleared++;
                }
            }

            console.log(`   ✅ ${updated} timetable slots re-linked to correct faculty`);
            console.log(`   ℹ️  ${cleared} slots unset (unassigned subjects)\n`);
        }

        // ── Final summary ─────────────────────────────────────────────────────
        console.log('═'.repeat(64));
        console.log('🎉  Done! Faculty names will now show correctly in:');
        console.log('    • Student portal → Subject & Faculty Allocation');
        console.log('    • Faculty portal → Subject & Faculty Allocation');
        console.log('    • Admin portal   → Subjects tab & Timetable');
        console.log('═'.repeat(64) + '\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Fatal:', err.message);
        console.error(err);
        process.exit(1);
    }
};

run();
