const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Subject code is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Subject name is required'],
        trim: true
    },
    credits: {
        type: Number,
        required: [true, 'Credits are required'],
        min: 1,
        max: 6
    },
    semester: {
        type: Number,
        required: [true, 'Semester is required'],
        min: 1,
        max: 8
    },
    branch: {
        type: String,
        enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'],
        required: [true, 'Branch is required']
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// ── Uniqueness Guards ──────────────────────────────────────────────────────
// 1. code is already unique (field-level above).
// 2. Prevent two subjects with the same name in the same semester+branch
//    (catches "ML LAB" vs "ML-LAB" style duplicates).
subjectSchema.index(
    { name: 1, semester: 1, branch: 1 },
    { unique: true, collation: { locale: 'en', strength: 2 } } // strength:2 = case-insensitive
);

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
