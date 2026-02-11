const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['P', 'A'], // P = Present, A = Absent
        required: true
    }
});

const attendanceSchema = new mongoose.Schema({
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Subject is required']
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Faculty is required']
    },
    date: {
        type: Date,
        required: [true, 'Date is required']
    },
    period: {
        type: Number,
        required: [true, 'Period is required'],
        min: 1,
        max: 6
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    branch: {
        type: String,
        enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'],
        required: true
    },
    records: [attendanceRecordSchema]
}, {
    timestamps: true
});

// Compound index to prevent duplicate attendance entries
attendanceSchema.index({ subject: 1, date: 1, period: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
