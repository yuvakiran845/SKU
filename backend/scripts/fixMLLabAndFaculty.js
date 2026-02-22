/**
 * fixMLLabAndFaculty.js
 * ──────────────────────────────────────────────────────────────
 * Fixes:
 *  1. ML Lab subject codes: any with sem=1 → sem=6, assign Rajesh Kumar
 *  2. Cloud Computing (CC) → assign Rajesh Kumar
 *  3. CNS (C&NS) → assign Smt. Chandrakala
 *  4. BDA → assign Smt. D Gousiya Begum
 *  5. Removes duplicate ML Lab (code 'ML LAB' sem 1) if it exists
 * ──────────────────────────────────────────────────────────────
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Subject = require('../models/Subject');

const run = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!uri) throw new Error('MONGODB_URI not set in .env');
        await mongoose.connect(uri);
        console.log('✅ MongoDB Connected\n');

        // ─── Find all ML Lab variants ─────────────────────────────────────────
        const mlLabSubjects = await Subject.find({
            name: { $regex: /machine.?learning.?lab/i }
        });
        console.log(`Found ${mlLabSubjects.length} ML Lab subject(s):`);
        mlLabSubjects.forEach(s => console.log(`  [${s._id}] code="${s.code}" name="${s.name}" sem=${s.semester}`));

        // Find Rajesh Kumar
        const rajesh = await User.findOne({ role: 'faculty', name: { $regex: /Rajesh/i } });
        if (!rajesh) {
            console.error('❌ Rajesh Kumar faculty not found!');
            process.exit(1);
        }
        console.log(`\nRajesh Kumar: ${rajesh.name} (${rajesh._id})`);

        // Fix each ML Lab subject
        for (const sub of mlLabSubjects) {
            if (sub.semester !== 6) {
                sub.semester = 6;
                console.log(`  ✅ Updated ${sub.code} semester: ${sub.semester} → 6`);
            }
            sub.faculty = rajesh._id;
            await sub.save();
            console.log(`  ✅ ${sub.code} (${sub.name}) → Sem 6, Faculty: ${rajesh.name}`);

            // Make sure rajesh.subjects includes this
            if (!rajesh.subjects.map(s => s.toString()).includes(sub._id.toString())) {
                rajesh.subjects.push(sub._id);
            }
        }
        await rajesh.save();

        // ─── Fix Cloud Computing ───────────────────────────────────────────────
        const cc = await Subject.findOne({ code: 'CC' });
        if (cc) {
            cc.faculty = rajesh._id;
            await cc.save();
            console.log(`\n✅ Cloud Computing → Faculty: ${rajesh.name}`);
        }

        // ─── Fix CNS ──────────────────────────────────────────────────────────
        const cns = await Subject.findOne({ code: 'C&NS' });
        const chandrakala = await User.findOne({ role: 'faculty', name: { $regex: /Chandrakala/i } });
        if (cns && chandrakala) {
            cns.faculty = chandrakala._id;
            await cns.save();
            console.log(`✅ CNS → Faculty: ${chandrakala.name}`);
        } else {
            console.warn(`⚠️  CNS or Chandrakala not found. cns=${!!cns} chandrakala=${!!chandrakala}`);
        }

        // ─── Fix BDA ──────────────────────────────────────────────────────────
        const bda = await Subject.findOne({ code: 'BDA' });
        const gousiya = await User.findOne({ role: 'faculty', name: { $regex: /Gousiya/i } });
        if (bda && gousiya) {
            bda.faculty = gousiya._id;
            await bda.save();
            console.log(`✅ BDA → Faculty: ${gousiya.name}`);
        } else {
            console.warn(`⚠️  BDA or Gousiya not found. bda=${!!bda} gousiya=${!!gousiya}`);
        }

        // ─── Final status ────────────────────────────────────────────────────
        console.log('\n══════════════════════════════════════════════');
        console.log('✅ All fixes applied!');
        const all = await Subject.find({ branch: 'CSE' }).populate('faculty', 'name').sort({ semester: 1, code: 1 });
        all.forEach(s => {
            console.log(`  ${s.code.padEnd(12)} | sem=${s.semester} | ${(s.faculty ? s.faculty.name : 'UNASSIGNED').padEnd(30)}`);
        });
        console.log('══════════════════════════════════════════════\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
};

run();
