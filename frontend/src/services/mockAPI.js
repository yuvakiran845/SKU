import {
    findUser,
    generateMockToken,
    generateMockAttendance,
    generateMockMarks,
    mockTimetable,
    mockAnnouncements,
    mockUsers
} from './mockData';

// Simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API responses
export const mockAPI = {
    // Auth endpoints
    async login(email, password) {
        await delay();

        const user = findUser(email, password);

        if (!user) {
            throw {
                response: {
                    status: 401,
                    data: { message: 'Invalid email or password' }
                }
            };
        }

        const accessToken = generateMockToken(user);
        const refreshToken = generateMockToken({ ...user, type: 'refresh' });

        return {
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isFirstLogin: user.isFirstLogin
                }
            }
        };
    },

    async changePassword(currentPassword, newPassword) {
        await delay();

        // In mock mode, always succeed
        return {
            data: {
                message: 'Password changed successfully'
            }
        };
    },

    async refreshToken(refreshToken) {
        await delay();

        // Generate new access token
        const accessToken = generateMockToken({ userId: 'mock', role: 'student' });

        return {
            data: { accessToken }
        };
    },

    // Student endpoints
    async getStudentProfile() {
        await delay();

        const student = mockUsers.students[0]; // Use first student as logged in user

        return {
            data: {
                id: student.id,
                name: student.name,
                email: student.email,
                rollNumber: student.rollNumber,
                branch: student.branch,
                semester: student.semester
            }
        };
    },

    async getStudentAttendance() {
        await delay();

        const attendance = generateMockAttendance('student_1');

        return {
            data: attendance
        };
    },

    async getStudentMarks() {
        await delay();

        const marks = generateMockMarks('student_1');

        return {
            data: marks
        };
    },

    async getStudentTimetable() {
        await delay();

        return {
            data: mockTimetable
        };
    },

    async getStudentAnnouncements() {
        await delay();

        return {
            data: mockAnnouncements
        };
    },

    // Faculty endpoints
    async getFacultyProfile() {
        await delay();

        return {
            data: {
                id: mockUsers.faculty.id,
                name: mockUsers.faculty.name,
                email: mockUsers.faculty.email,
                employeeId: mockUsers.faculty.employeeId
            }
        };
    },

    async getFacultySubjects() {
        await delay();

        return {
            data: [
                { id: 'sub_1', code: 'CSE301', name: 'Data Structures' },
                { id: 'sub_2', code: 'CSE302', name: 'Database Management Systems' }
            ]
        };
    },

    async getStudentsBySubject(subjectId) {
        await delay();

        return {
            data: mockUsers.students.slice(0, 40).map(s => ({
                id: s.id,
                name: s.name,
                rollNumber: s.rollNumber
            }))
        };
    },

    async markAttendance(data) {
        await delay();

        return {
            data: {
                message: 'Attendance marked successfully'
            }
        };
    },

    async enterMarks(data) {
        await delay();

        return {
            data: {
                message: 'Marks entered successfully'
            }
        };
    },

    async postAnnouncement(data) {
        await delay();

        return {
            data: {
                message: 'Announcement posted successfully'
            }
        };
    },

    // Admin endpoints
    async getAllStudents(params) {
        await delay();

        return {
            data: {
                students: mockUsers.students.slice(0, 20),
                total: mockUsers.students.length,
                page: 1,
                limit: 20
            }
        };
    },

    async createStudent(data) {
        await delay();

        return {
            data: {
                message: 'Student created successfully',
                student: data
            }
        };
    },

    async getSystemStats() {
        await delay();

        return {
            data: {
                totalStudents: 50,
                totalFaculty: 10,
                totalSubjects: 5,
                activeAnnouncements: 6
            }
        };
    }
};
