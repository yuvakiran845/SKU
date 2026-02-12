import axios from 'axios';
import { mockAPI } from './mockAPI';

// 🔧 TOGGLE THIS FLAG 🔧
// Set to true to use mock data (for testing without backend)
// Set to false when real backend is ready
const USE_MOCK_API = false;

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and it's NOT the login endpoint itself
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login')) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                const response = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken } = response.data;
                localStorage.setItem('accessToken', accessToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // If login fails (401), we simply reject, don't try to refresh
        if (originalRequest.url.includes('/auth/login')) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }

        return Promise.reject(error);
    }
);

// ===========================
// AUTH API
// ===========================

export const authAPI = {
    login: (email, password) =>
        USE_MOCK_API
            ? mockAPI.login(email, password)
            : api.post('/auth/login', { email, password }),

    changePassword: (currentPassword, newPassword) =>
        USE_MOCK_API
            ? mockAPI.changePassword(currentPassword, newPassword)
            : api.post('/auth/change-password', { currentPassword, newPassword }),

    refreshToken: (refreshToken) =>
        USE_MOCK_API
            ? mockAPI.refreshToken(refreshToken)
            : api.post('/auth/refresh', { refreshToken }),

    seedProduction: () =>
        USE_MOCK_API
            ? Promise.resolve({ data: { message: 'Mock data reset' } })
            : api.get('/auth/seed-production'),
};

// ===========================
// STUDENT API
// ===========================

export const studentAPI = {
    getProfile: () =>
        USE_MOCK_API
            ? mockAPI.getStudentProfile()
            : api.get('/student/profile'),

    getAttendance: () =>
        USE_MOCK_API
            ? mockAPI.getStudentAttendance()
            : api.get('/student/attendance'),

    getMarks: () =>
        USE_MOCK_API
            ? mockAPI.getStudentMarks()
            : api.get('/student/marks'),

    getTimetable: () =>
        USE_MOCK_API
            ? mockAPI.getStudentTimetable()
            : api.get('/student/timetable'),

    getAnnouncements: () =>
        USE_MOCK_API
            ? mockAPI.getStudentAnnouncements()
            : api.get('/student/announcements'),
};

// ===========================
// FACULTY API
// ===========================

export const facultyAPI = {
    getProfile: () =>
        USE_MOCK_API
            ? mockAPI.getFacultyProfile()
            : api.get('/faculty/profile'),

    getSubjects: () =>
        USE_MOCK_API
            ? mockAPI.getFacultySubjects()
            : api.get('/faculty/subjects'),

    getStudentsBySubject: (subjectId) =>
        USE_MOCK_API
            ? mockAPI.getStudentsBySubject(subjectId)
            : api.get(`/faculty/students/${subjectId}`),

    markAttendance: (data) =>
        USE_MOCK_API
            ? mockAPI.markAttendance(data)
            : api.post('/faculty/attendance', data),

    updateAttendance: (attendanceId, data) =>
        USE_MOCK_API
            ? mockAPI.markAttendance(data)
            : api.put(`/faculty/attendance/${attendanceId}`, data),

    getAttendanceBySubject: (subjectId, date) =>
        USE_MOCK_API
            ? mockAPI.getStudentsBySubject(subjectId)
            : api.get(`/faculty/attendance/${subjectId}`, { params: { date } }),

    enterMarks: (data) =>
        USE_MOCK_API
            ? mockAPI.enterMarks(data)
            : api.post('/faculty/marks', data),

    updateMarks: (markId, data) =>
        USE_MOCK_API
            ? mockAPI.enterMarks(data)
            : api.put(`/faculty/marks/${markId}`, data),

    getMarksBySubject: (subjectId) =>
        USE_MOCK_API
            ? mockAPI.getStudentMarks()
            : api.get(`/faculty/marks/${subjectId}`),

    postAnnouncement: (data) =>
        USE_MOCK_API
            ? mockAPI.postAnnouncement(data)
            : api.post('/faculty/announcements', data),

    getAnnouncements: () =>
        USE_MOCK_API
            ? mockAPI.getStudentAnnouncements()
            : api.get('/faculty/announcements'),

    getTimetable: () =>
        USE_MOCK_API
            ? mockAPI.getStudentTimetable()
            : api.get('/faculty/timetable'),

    getAnalytics: (subjectId) =>
        USE_MOCK_API
            ? mockAPI.getStudentAttendance()
            : api.get(`/faculty/analytics/${subjectId}`),
};

// ===========================
// ADMIN API
// ===========================

export const adminAPI = {
    // Student Management
    createStudent: (data) =>
        USE_MOCK_API
            ? mockAPI.createStudent(data)
            : api.post('/admin/students', data),

    updateStudent: (studentId, data) =>
        USE_MOCK_API
            ? mockAPI.createStudent(data)
            : api.put(`/admin/students/${studentId}`, data),

    deleteStudent: (studentId) =>
        USE_MOCK_API
            ? Promise.resolve({ data: { message: 'Student deleted' } })
            : api.delete(`/admin/students/${studentId}`),

    getAllStudents: (params) =>
        USE_MOCK_API
            ? mockAPI.getAllStudents(params)
            : api.get('/admin/students', { params }),

    getStudent: (studentId) =>
        USE_MOCK_API
            ? mockAPI.getStudentProfile()
            : api.get(`/admin/students/${studentId}`),

    // Faculty Management
    createFaculty: (data) =>
        USE_MOCK_API
            ? Promise.resolve({ data: { message: 'Faculty created', faculty: data } })
            : api.post('/admin/faculty', data),

    updateFaculty: (facultyId, data) =>
        USE_MOCK_API
            ? Promise.resolve({ data: { message: 'Faculty updated', faculty: data } })
            : api.put(`/admin/faculty/${facultyId}`, data),

    deleteFaculty: (facultyId) =>
        USE_MOCK_API
            ? Promise.resolve({ data: { message: 'Faculty deleted' } })
            : api.delete(`/admin/faculty/${facultyId}`),

    getAllFaculty: (params) =>
        USE_MOCK_API
            ? Promise.resolve({ data: { faculty: [], total: 0 } })
            : api.get('/admin/faculty', { params }),

    getFaculty: (facultyId) =>
        USE_MOCK_API
            ? mockAPI.getFacultyProfile()
            : api.get(`/admin/faculty/${facultyId}`),

    // Subject Management
    createSubject: (data) =>
        USE_MOCK_API
            ? Promise.resolve({ data: { message: 'Subject created', subject: data } })
            : api.post('/admin/subjects', data),

    updateSubject: (subjectId, data) =>
        USE_MOCK_API
            ? Promise.resolve({ data: { message: 'Subject updated', subject: data } })
            : api.put(`/admin/subjects/${subjectId}`, data),

    deleteSubject: (subjectId) =>
        USE_MOCK_API
            ? Promise.resolve({ data: { message: 'Subject deleted' } })
            : api.delete(`/admin/subjects/${subjectId}`),

    getAllSubjects: () =>
        USE_MOCK_API
            ? mockAPI.getFacultySubjects()
            : api.get('/admin/subjects'),

    assignSubjectToFaculty: (subjectId, facultyId) =>
        USE_MOCK_API
            ? Promise.resolve({ data: { message: 'Subject assigned' } })
            : api.post('/admin/subjects/assign', { subjectId, facultyId }),

    assignSubjectsToStudent: (studentId, subjectIds) =>
        USE_MOCK_API
            ? Promise.resolve({ data: { message: 'Subjects assigned' } })
            : api.post('/admin/students/assign-subjects', { studentId, subjectIds }),

    // System Management
    getLogs: (params) =>
        USE_MOCK_API
            ? Promise.resolve({ data: { logs: [], total: 0 } })
            : api.get('/admin/logs', { params }),

    getSystemStats: () =>
        USE_MOCK_API
            ? mockAPI.getSystemStats()
            : api.get('/admin/stats'),

    bulkCreateStudents: (data) =>
        USE_MOCK_API
            ? Promise.resolve({ data: { message: 'Students created', count: data.length } })
            : api.post('/admin/students/bulk', data),

    // Timetable Management
    getTimetable: (params) =>
        USE_MOCK_API
            ? mockAPI.getStudentTimetable()
            : api.get('/admin/timetable', { params }),

    updateTimetableSlot: (data) =>
        USE_MOCK_API
            ? Promise.resolve({ data: { message: 'Timetable updated' } })
            : api.put('/admin/timetable/slot', data),
};

export default api;
