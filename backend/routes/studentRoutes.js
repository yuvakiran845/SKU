const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getProfile,
    getAttendance,
    getMarks,
    getTimetable,
    getAnnouncements
} = require('../controllers/studentController');

// All routes are protected and only for students
router.use(protect);
router.use(authorize('student'));

router.get('/profile', getProfile);
router.get('/attendance', getAttendance);
router.get('/marks', getMarks);
router.get('/timetable', getTimetable);
router.get('/announcements', getAnnouncements);

module.exports = router;
