const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getProfile,
    getSubjects,
    getStudentsBySubject,
    markAttendance,
    getAttendanceBySubject,
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
router.get('/subjects', getSubjects);
router.get('/students/:subjectId', getStudentsBySubject);

// Attendance routes
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
