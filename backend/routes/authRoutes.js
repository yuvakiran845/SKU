const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    login,
    refreshToken,
    changePassword,
    getMe
} = require('../controllers/authController');

// Public routes
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/seed-production', require('../controllers/authController').seedProductionDatabase);

// Protected routes
router.post('/change-password', protect, changePassword);
router.get('/me', protect, getMe);

module.exports = router;
