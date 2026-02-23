const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getProfile,
    getMySubject,
    getSubjects,
    getStudentsBySubject,
    markAttendance,
    checkAttendance,
    getAttendanceBySubject,
    getAttendanceCount,
    enterMarks,
    getMarksBySubject,
    postAnnouncement,
    getAnnouncements,
    getTimetable
} = require('../controllers/facultyController');

// All routes are protected and only for faculty
router.use(protect);
router.use(authorize('faculty'));

router.get('/profile', getProfile);

// My Subject - returns the SINGLE subject this faculty is registered to
router.get('/my-subject', getMySubject);

// All subjects (legacy / admin use)
router.get('/subjects', getSubjects);

router.get('/students/:subjectId', getStudentsBySubject);

// Attendance routes
// IMPORTANT: /check and /count must come BEFORE /:subjectId to avoid route conflict
router.get('/attendance/check', checkAttendance);
router.get('/attendance/count/:subjectId', getAttendanceCount);
router.post('/attendance', markAttendance);
router.get('/attendance/:subjectId', getAttendanceBySubject);

// Marks routes
router.post('/marks', enterMarks);
router.get('/marks/:subjectId', getMarksBySubject);

// Announcement routes
router.post('/announcements', postAnnouncement);
router.get('/announcements', getAnnouncements);

// Timetable route
router.get('/timetable', getTimetable);

module.exports = router;
