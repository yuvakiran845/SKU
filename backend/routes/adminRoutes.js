const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createStudent,
    getAllStudents,
    getStudent,
    updateStudent,
    deleteStudent,
    createFaculty,
    getAllFaculty,
    deleteFaculty,
    createSubject,
    getAllSubjects,
    assignSubjectToFaculty,
    getSystemStats,
    bulkCreateStudents,
    getTimetable,
    updateTimetableSlot
} = require('../controllers/adminController');

// All routes are protected and only for admins
router.use(protect);
router.use(authorize('admin'));

// Student management routes
router.post('/students', createStudent);
router.get('/students', getAllStudents);
router.get('/students/:id', getStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);
router.post('/students/bulk', bulkCreateStudents);

// Faculty management routes
router.post('/faculty', createFaculty);
router.get('/faculty', getAllFaculty);
router.delete('/faculty/:id', deleteFaculty);

// Subject management routes
router.post('/subjects', createSubject);
router.get('/subjects', getAllSubjects);
router.post('/subjects/assign', assignSubjectToFaculty);

// System routes
router.get('/stats', getSystemStats);

// Timetable routes
router.get('/timetable', getTimetable);
router.put('/timetable/slot', updateTimetableSlot);

module.exports = router;
