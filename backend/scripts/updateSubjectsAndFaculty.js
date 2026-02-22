/**
 * updateSubjectsAndFaculty.js
 * ──────────────────────────────────────────────────────────────
 * 1. Fix ML Lab (ML-LAB) → semester 6, assign faculty "Rajesh Kumar"
 * 2. Assign Cloud Computing (CC) faculty → Rajesh Kumar
 * 3. Assign CNS (C&NS) faculty → Smt. Chandrakala
 * 4. Assign BDA faculty → Smt. D Gousiya Begum
 * 5. Ensure ML Lab exists as a subject for attendance tracking
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
        console.log('✅ MongoDB Connected');

        // ─── 1. Find or create ML Lab subject with correct semester ───────────
        let mlLab = await Subject.findOne({ code: 'ML-LAB' });
        if (!mlLab) {
            mlLab = await Subject.create({
                code: 'ML-LAB',
                name: 'Machine Learning Lab',
                credits: 2,
                semester: 6,
                branch: 'CSE'
            });
            console.log('✅ ML Lab subject created (ML-LAB, Sem 6)');
        } else if (mlLab.semester !== 6) {
            mlLab.semester = 6;
            await mlLab.save();
            console.log('✅ ML Lab semester updated to 6');
        } else {
            console.log('ℹ️  ML Lab already exists with semester 6');
        }

        // ─── 2. Find Rajesh Kumar faculty ─────────────────────────────────────
        let rajesh = await User.findOne({ role: 'faculty', name: { $regex: /Rajesh/i } });
        if (!rajesh) {
            console.warn('⚠️  Rajesh Kumar faculty not found. Creating one...');
            rajesh = await User.create({
                name: 'Rajesh Kumar',
                email: 'rajesh.kumar@skucet.edu',
                password: 'password123',
                role: 'faculty',
                employeeId: 'FAC' + Math.floor(1000 + Math.random() * 9000),
                isFirstLogin: false,
                subjects: []
            });
            console.log('✅ Rajesh Kumar faculty created');
        } else {
            console.log(`ℹ️  Found Rajesh faculty: ${rajesh.name} (${rajesh._id})`);
        }

        // ─── 3. Assign ML-LAB to Rajesh Kumar ────────────────────────────────
        mlLab.faculty = rajesh._id;
        await mlLab.save();
        if (!rajesh.subjects.map(s => s.toString()).includes(mlLab._id.toString())) {
            rajesh.subjects.push(mlLab._id);
        }

        // ─── 4. Assign Cloud Computing (CC) to Rajesh Kumar ──────────────────
        const cc = await Subject.findOne({ code: 'CC' });
        if (cc) {
            cc.faculty = rajesh._id;
            await cc.save();
            if (!rajesh.subjects.map(s => s.toString()).includes(cc._id.toString())) {
                rajesh.subjects.push(cc._id);
            }
            console.log('✅ Cloud Computing faculty set to Rajesh Kumar');
        } else {
            console.warn('⚠️  Cloud Computing subject not found');
        }

        await rajesh.save();
        console.log('✅ ML Lab faculty set to Rajesh Kumar');

        // ─── 5. Assign CNS (C&NS) to Smt. Chandrakala ────────────────────────
        const cns = await Subject.findOne({ code: 'C&NS' });
        let chandrakala = await User.findOne({ role: 'faculty', name: { $regex: /Chandrakala/i } });
        if (!chandrakala) {
            console.warn('⚠️  Chandrakala not found. Creating...');
            chandrakala = await User.create({
                name: 'Smt. Chandrakala',
                email: 'chandrakala@skucet.edu',
                password: 'password123',
                role: 'faculty',
                employeeId: 'FAC' + Math.floor(1000 + Math.random() * 9000),
                isFirstLogin: false,
                subjects: []
            });
        }
        if (cns) {
            cns.faculty = chandrakala._id;
            await cns.save();
            if (!chandrakala.subjects.map(s => s.toString()).includes(cns._id.toString())) {
                chandrakala.subjects.push(cns._id);
                await chandrakala.save();
            }
            console.log('✅ CNS (C&NS) faculty set to Smt. Chandrakala');
        } else {
            console.warn('⚠️  CNS subject (C&NS) not found');
        }

        // ─── 6. Assign BDA to Smt. D Gousiya Begum ───────────────────────────
        const bda = await Subject.findOne({ code: 'BDA' });
        let gousiya = await User.findOne({ role: 'faculty', name: { $regex: /Gousiya/i } });
        if (!gousiya) {
            console.warn('⚠️  Gousiya Begum not found. Creating...');
            gousiya = await User.create({
                name: 'Smt. D Gousiya Begum',
                email: 'gousiya@skucet.edu',
                password: 'password123',
                role: 'faculty',
                employeeId: 'FAC' + Math.floor(1000 + Math.random() * 9000),
                isFirstLogin: false,
                subjects: []
            });
        }
        if (bda) {
            bda.faculty = gousiya._id;
            await bda.save();
            if (!gousiya.subjects.map(s => s.toString()).includes(bda._id.toString())) {
                gousiya.subjects.push(bda._id);
                await gousiya.save();
            }
            console.log('✅ BDA faculty confirmed as Smt. D Gousiya Begum');
        } else {
            console.warn('⚠️  BDA subject not found');
        }

        // ─── Summary ──────────────────────────────────────────────────────────
        console.log('\n══════════════════════════════════════════════════');
        console.log('✅ All subject/faculty updates completed!');
        console.log('  • ML Lab → Sem 6, Faculty: Rajesh Kumar');
        console.log('  • Cloud Computing → Faculty: Rajesh Kumar');
        console.log('  • CNS (C&NS) → Faculty: Smt. Chandrakala');
        console.log('  • BDA → Faculty: Smt. D Gousiya Begum');
        console.log('══════════════════════════════════════════════════\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

run();
