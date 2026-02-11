const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Student is required']
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Subject is required']
    },
    semester: {
        type: Number,
        required: [true, 'Semester is required'],
        min: 1,
        max: 8
    },
    examType: {
        type: String,
        enum: ['mid1', 'mid2', 'final'],
        required: [true, 'Exam type is required']
    },
    marksObtained: {
        type: Number,
        required: [true, 'Marks obtained is required'],
        min: 0
    },
    totalMarks: {
        type: Number,
        required: [true, 'Total marks is required'],
        default: 20 // Default for internal exams
    },
    enteredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate marks entries
marksSchema.index({ student: 1, subject: 1, semester: 1, examType: 1 }, { unique: true });

// Virtual for percentage
marksSchema.virtual('percentage').get(function () {
    return ((this.marksObtained / this.totalMarks) * 100).toFixed(2);
});

const Marks = mongoose.model('Marks', marksSchema);

module.exports = Marks;
