/**
 * removeDuplicateMLLab.js
 * ─────────────────────────────────────────────────────────────────
 * Removes the duplicate "Machine learning lab" subject (code: "ML LAB", 3 credits)
 * and keeps only the canonical "Machine Learning Lab" (code: "ML-LAB", 2 credits).
 *
 * Also cleans up any attendance records linked to the removed subject,
 * and removes the duplicate subject from any timetable slots / faculty arrays.
 * ─────────────────────────────────────────────────────────────────
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Register all models first to avoid MissingSchemaError
const User = require('../models/User');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');

const run = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!uri) throw new Error('MONGODB_URI not set');
        await mongoose.connect(uri);
        console.log('✅ MongoDB Connected\n');

        // ── 1. Find both ML Lab subjects ──────────────────────────────────────
        const allMLLabs = await Subject.find({
            name: { $regex: /machine.?learning.?lab/i }
        }).lean();

        console.log(`Found ${allMLLabs.length} ML Lab subject(s):`);
        allMLLabs.forEach(s =>
            console.log(`  [${s._id}] code="${s.code}" | name="${s.name}" | sem=${s.semester} | credits=${s.credits}`)
        );

        if (allMLLabs.length <= 1) {
            console.log('\nℹ️  Only one ML Lab found — nothing to remove!');
            await mongoose.disconnect();
            return process.exit(0);
        }

        // ── 2. Decide which to KEEP (prefer "ML-LAB", 2 credits) ─────────────
        //    Keep the one with the standard hyphenated code "ML-LAB"
        const keeper = allMLLabs.find(s => s.code === 'ML-LAB') || allMLLabs[0];
        const toDelete = allMLLabs.filter(s => s._id.toString() !== keeper._id.toString());

        console.log(`\n✅ Keeping : [${keeper._id}] "${keeper.code}" — "${keeper.name}"`);
        toDelete.forEach(s =>
            console.log(`🗑️  Removing: [${s._id}] "${s.code}" — "${s.name}"`)
        );

        for (const dup of toDelete) {
            const dupId = dup._id;

            // 2a. Remove attendance records for the duplicate
            const attResult = await Attendance.deleteMany({ subject: dupId });
            console.log(`   → Deleted ${attResult.deletedCount} attendance record(s) linked to duplicate`);

            // 2b. Remove from timetable slots (set to keeper instead, or remove slot)
            const timetables = await Timetable.find({ 'slots.subject': dupId });
            for (const tt of timetables) {
                let changed = false;
                tt.slots.forEach(slot => {
                    if (slot.subject && slot.subject.toString() === dupId.toString()) {
                        // Replace duplicate with keeper in timetable
                        slot.subject = keeper._id;
                        changed = true;
                    }
                });
                if (changed) {
                    await tt.save();
                    console.log(`   → Updated timetable [${tt._id}] to use keeper ML-LAB`);
                }
            }

            // 2c. Remove from faculty subjects arrays
            const facWithDup = await User.find({ role: 'faculty', subjects: dupId });
            for (const fac of facWithDup) {
                fac.subjects = fac.subjects.filter(s => s.toString() !== dupId.toString());
                // Make sure keeper is in their list
                if (!fac.subjects.map(s => s.toString()).includes(keeper._id.toString())) {
                    fac.subjects.push(keeper._id);
                }
                await fac.save();
                console.log(`   → Fixed faculty subjects for: ${fac.name}`);
            }

            // 2d. Delete the duplicate subject document
            await Subject.findByIdAndDelete(dupId);
            console.log(`   → Subject document deleted: "${dup.code}"`);
        }

        // ── 3. Verify final state ─────────────────────────────────────────────
        const remaining = await Subject.find({
            name: { $regex: /machine.?learning.?lab/i }
        }).populate('faculty', 'name').lean();

        console.log(`\n✅ Remaining ML Lab subjects: ${remaining.length}`);
        remaining.forEach(s =>
            console.log(`  code="${s.code}" | name="${s.name}" | sem=${s.semester} | faculty=${s.faculty?.name || 'UNASSIGNED'}`)
        );

        // ── 4. Show all Sem 6 CSE subjects (deduplication check) ─────────────
        console.log('\n── All Sem 6 CSE Subjects after cleanup ──');
        const allSem6 = await Subject.find({ branch: 'CSE', semester: 6 })
            .populate('faculty', 'name')
            .sort({ code: 1 })
            .lean();

        allSem6.forEach(s =>
            console.log(`  ${s.code.padEnd(12)}| ${s.name.padEnd(38)}| ${s.faculty?.name || 'UNASSIGNED'}`)
        );

        console.log('\n🎉 Duplicate removal complete!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
};

run();
