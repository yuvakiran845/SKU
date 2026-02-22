require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const m = require('mongoose');
const S = require('../models/Subject');

m.connect(process.env.MONGODB_URI || process.env.MONGO_URI).then(async () => {
    const codes = ['ML-LAB', 'ML LAB', 'CC', 'C&NS', 'BDA'];
    for (const code of codes) {
        const sub = await S.findOne({ code }).populate('faculty', 'name');
        if (sub) {
            console.log(`${code.padEnd(10)} | sem=${sub.semester} | ${sub.name.padEnd(35)} | ${sub.faculty ? sub.faculty.name : 'UNASSIGNED'}`);
        } else {
            // Also try by name for ML LAB
            const byName = await S.find({ name: { $regex: code, $options: 'i' } }).populate('faculty', 'name');
            byName.forEach(s => console.log(`${s.code.padEnd(10)} | sem=${s.semester} | ${s.name.padEnd(35)} | ${s.faculty ? s.faculty.name : 'UNASSIGNED'}`));
        }
    }
    // Also show all ML Lab variants
    const mlLabs = await S.find({ name: /machine.?learning.?lab/i }).populate('faculty', 'name');
    console.log('\n-- All Machine Learning Lab subjects --');
    mlLabs.forEach(s => console.log(`${s.code.padEnd(10)} | sem=${s.semester} | ${s.name} | fac: ${s.faculty ? s.faculty.name : 'UNASSIGNED'}`));

    await m.disconnect();
    process.exit(0);
});
