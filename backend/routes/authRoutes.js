const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    login,
    refreshToken,
    changePassword,
    getMe,
    simpleFacultyRegister,
    getAvailableSubjects,
} = require('../controllers/authController');

// Public routes
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/seed-production', require('../controllers/authController').seedProductionDatabase);

// Faculty Registration — no OTP, faculty sets own email + password
router.post('/register-faculty', simpleFacultyRegister);

// Available subjects for registration dropdown
router.get('/available-subjects', getAvailableSubjects);

// Protected routes
router.post('/change-password', protect, changePassword);
router.get('/me', protect, getMe);

module.exports = router;
