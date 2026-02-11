const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true
    },
    targetRole: {
        type: String,
        enum: ['all', 'student', 'faculty'],
        default: 'all'
    },
    targetSemester: {
        type: Number,
        min: 1,
        max: 8
    },
    targetBranch: {
        type: String,
        enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL']
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient querying
announcementSchema.index({ targetRole: 1, targetSemester: 1, targetBranch: 1, isActive: 1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
