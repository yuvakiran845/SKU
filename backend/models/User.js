const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['student', 'faculty', 'admin'],
        required: [true, 'Role is required']
    },
    isFirstLogin: {
        type: Boolean,
        default: true
    },

    // Student-specific fields
    rollNumber: {
        type: String,
        sparse: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    branch: {
        type: String,
        enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'],
    },
    semester: {
        type: Number,
        min: 1,
        max: 8
    },

    // Faculty-specific fields
    employeeId: {
        type: String,
        sparse: true,
        unique: true,
        uppercase: true,
        trim: true
    },

    // The ONE subject this faculty is registered to (unique constraint: 1 faculty per subject)
    registeredSubject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        sparse: true,
        unique: true
    },

    // The original registration email (for audit/display)
    registrationEmail: {
        type: String,
        lowercase: true,
        trim: true
    },

    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }],

    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.toPublicJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
