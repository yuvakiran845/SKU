// Mock data for testing without backend
export const mockUsers = {
    // Students (50 students)
    students: Array.from({ length: 50 }, (_, i) => {
        const rollNumber = `2310${String(i + 101).padStart(3, '0')}`;
        return {
            id: `student_${i + 1}`,
            email: `${rollNumber}@sku.edu`,
            password: rollNumber,
            name: `Student ${i + 1}`,
            role: 'student',
            rollNumber,
            branch: 'CSE',
            semester: 3,
            isFirstLogin: false
        };
    }),

    // Faculty
    faculty: {
        id: 'faculty_1',
        email: 'sku@faculty.edu',
        password: 'faculty123',
        name: 'Dr. Rajesh Kumar',
        role: 'faculty',
        employeeId: 'FAC001',
        isFirstLogin: false
    },

    // Admin
    admin: {
        id: 'admin_1',
        email: 'sku@admin.edu',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
        isFirstLogin: false
    }
};

// Mock subjects
export const mockSubjects = [
    { id: 'sub_1', code: 'CSE301', name: 'Data Structures', credits: 4 },
    { id: 'sub_2', code: 'CSE302', name: 'Database Management Systems', credits: 4 },
    { id: 'sub_3', code: 'CSE303', name: 'Operating Systems', credits: 4 },
    { id: 'sub_4', code: 'CSE304', name: 'Computer Networks', credits: 4 },
    { id: 'sub_5', code: 'CSE305', name: 'Software Engineering', credits: 3 }
];

// Generate mock attendance for a student
export const generateMockAttendance = (studentId) => {
    return mockSubjects.map(subject => {
        const total = 30 + Math.floor(Math.random() * 10);
        const present = Math.floor(total * (0.65 + Math.random() * 0.25)); // 65-90%
        const absent = total - present;
        const percentage = ((present / total) * 100).toFixed(2);

        return {
            subjectId: subject.id,
            subjectName: subject.name,
            subjectCode: subject.code,
            present,
            absent,
            total,
            percentage: parseFloat(percentage)
        };
    });
};

// Generate mock marks for a student
export const generateMockMarks = (studentId) => {
    return mockSubjects.map(subject => {
        const mid1 = 10 + Math.floor(Math.random() * 11); // 10-20
        const mid2 = 10 + Math.floor(Math.random() * 11); // 10-20

        return {
            subjectId: subject.id,
            subjectName: subject.name,
            subjectCode: subject.code,
            mid1,
            mid2
        };
    });
};

// Mock timetable
export const mockTimetable = [
    // Monday
    { day: 'Monday', period: 1, startTime: '09:00 AM', endTime: '10:00 AM', subjectName: 'Data Structures', facultyName: 'Dr. Rajesh Kumar' },
    { day: 'Monday', period: 2, startTime: '10:00 AM', endTime: '11:00 AM', subjectName: 'Database Management Systems', facultyName: 'Dr. Priya Sharma' },
    { day: 'Monday', period: 3, startTime: '11:15 AM', endTime: '12:15 PM', subjectName: 'Operating Systems', facultyName: 'Prof. Amit Singh' },
    { day: 'Monday', period: 4, startTime: '12:15 PM', endTime: '01:15 PM', subjectName: 'Computer Networks', facultyName: 'Dr. Sunita Reddy' },

    // Tuesday
    { day: 'Tuesday', period: 1, startTime: '09:00 AM', endTime: '10:00 AM', subjectName: 'Software Engineering', facultyName: 'Dr. Vijay Patel' },
    { day: 'Tuesday', period: 2, startTime: '10:00 AM', endTime: '11:00 AM', subjectName: 'Data Structures', facultyName: 'Dr. Rajesh Kumar' },
    { day: 'Tuesday', period: 3, startTime: '11:15 AM', endTime: '12:15 PM', subjectName: 'Database Management Systems', facultyName: 'Dr. Priya Sharma' },
    { day: 'Tuesday', period: 4, startTime: '12:15 PM', endTime: '01:15 PM', subjectName: 'Operating Systems', facultyName: 'Prof. Amit Singh' },

    // Wednesday
    { day: 'Wednesday', period: 1, startTime: '09:00 AM', endTime: '10:00 AM', subjectName: 'Computer Networks', facultyName: 'Dr. Sunita Reddy' },
    { day: 'Wednesday', period: 2, startTime: '10:00 AM', endTime: '11:00 AM', subjectName: 'Software Engineering', facultyName: 'Dr. Vijay Patel' },
    { day: 'Wednesday', period: 3, startTime: '11:15 AM', endTime: '12:15 PM', subjectName: 'Data Structures Lab', facultyName: 'Dr. Rajesh Kumar' },
    { day: 'Wednesday', period: 4, startTime: '12:15 PM', endTime: '01:15 PM', subjectName: 'Data Structures Lab', facultyName: 'Dr. Rajesh Kumar' },

    // Thursday
    { day: 'Thursday', period: 1, startTime: '09:00 AM', endTime: '10:00 AM', subjectName: 'Database Management Systems', facultyName: 'Dr. Priya Sharma' },
    { day: 'Thursday', period: 2, startTime: '10:00 AM', endTime: '11:00 AM', subjectName: 'Operating Systems', facultyName: 'Prof. Amit Singh' },
    { day: 'Thursday', period: 3, startTime: '11:15 AM', endTime: '12:15 PM', subjectName: 'Computer Networks', facultyName: 'Dr. Sunita Reddy' },
    { day: 'Thursday', period: 4, startTime: '12:15 PM', endTime: '01:15 PM', subjectName: 'Software Engineering', facultyName: 'Dr. Vijay Patel' },

    // Friday
    { day: 'Friday', period: 1, startTime: '09:00 AM', endTime: '10:00 AM', subjectName: 'Data Structures', facultyName: 'Dr. Rajesh Kumar' },
    { day: 'Friday', period: 2, startTime: '10:00 AM', endTime: '11:00 AM', subjectName: 'DBMS Lab', facultyName: 'Dr. Priya Sharma' },
    { day: 'Friday', period: 3, startTime: '11:15 AM', endTime: '12:15 PM', subjectName: 'DBMS Lab', facultyName: 'Dr. Priya Sharma' },
    { day: 'Friday', period: 4, startTime: '12:15 PM', endTime: '01:15 PM', subjectName: 'Operating Systems', facultyName: 'Prof. Amit Singh' },

    // Saturday
    { day: 'Saturday', period: 1, startTime: '09:00 AM', endTime: '10:00 AM', subjectName: 'Computer Networks', facultyName: 'Dr. Sunita Reddy' },
    { day: 'Saturday', period: 2, startTime: '10:00 AM', endTime: '11:00 AM', subjectName: 'Software Engineering', facultyName: 'Dr. Vijay Patel' },
];

// Mock announcements
export const mockAnnouncements = [
    {
        id: 'ann_1',
        title: 'Mid-Term Examination Schedule Released',
        message: 'The Mid-2 examination schedule has been released. Please check the notice board for detailed timings and venues.',
        targetRole: 'student',
        subjectName: null,
        createdAt: new Date('2026-02-03').toISOString(),
        createdBy: 'Admin'
    },
    {
        id: 'ann_2',
        title: 'Database Lab Cancelled - 5th Feb',
        message: 'The DBMS Lab scheduled for 5th February is cancelled due to faculty unavailability. Make-up class will be announced soon.',
        targetRole: 'student',
        subjectName: 'Database Management Systems',
        createdAt: new Date('2026-02-04').toISOString(),
        createdBy: 'Dr. Priya Sharma'
    },
    {
        id: 'ann_3',
        title: 'Data Structures Assignment Submission',
        message: 'Assignment on Trees and Graphs is due by 10th February. Late submissions will not be accepted.',
        targetRole: 'student',
        subjectName: 'Data Structures',
        createdAt: new Date('2026-02-01').toISOString(),
        createdBy: 'Dr. Rajesh Kumar'
    },
    {
        id: 'ann_4',
        title: 'Guest Lecture on Cloud Computing',
        message: 'We are organizing a guest lecture on Cloud Computing and DevOps on 8th February at 2 PM in the seminar hall. All students are encouraged to attend.',
        targetRole: 'student',
        subjectName: null,
        createdAt: new Date('2026-01-30').toISOString(),
        createdBy: 'HOD - CSE Department'
    },
    {
        id: 'ann_5',
        title: 'Software Engineering Project Presentations',
        message: 'Final project presentations for Software Engineering will be held from 15th to 20th February. Groups should prepare their demos and documentation.',
        targetRole: 'student',
        subjectName: 'Software Engineering',
        createdAt: new Date('2026-01-28').toISOString(),
        createdBy: 'Dr. Vijay Patel'
    },
    {
        id: 'ann_6',
        title: 'Library Timing Extended During Exams',
        message: 'The library will remain open until 10 PM during the examination period. Students can utilize this extended time for preparation.',
        targetRole: 'student',
        subjectName: null,
        createdAt: new Date('2026-01-25').toISOString(),
        createdBy: 'Librarian'
    }
];

// Helper function to find user
export const findUser = (email, password) => {
    // Check students
    const student = mockUsers.students.find(s => s.email === email && s.password === password);
    if (student) return student;

    // Check faculty
    if (mockUsers.faculty.email === email && mockUsers.faculty.password === password) {
        return mockUsers.faculty;
    }

    // Check admin
    if (mockUsers.admin.email === email && mockUsers.admin.password === password) {
        return mockUsers.admin;
    }

    return null;
};

// Generate mock JWT token
export const generateMockToken = (user) => {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        isFirstLogin: user.isFirstLogin
    };

    // Create a fake JWT-like token (base64 encoded)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadStr = btoa(JSON.stringify(payload));
    const signature = btoa('mock-signature');

    return `${header}.${payloadStr}.${signature}`;
};
