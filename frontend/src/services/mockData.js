// Mock data for testing without backend

// Mock subjects
export const mockSubjects = [
    { id: 'sub_1', code: 'BDA', name: 'Big Data Analytics', credits: 4 },
    { id: 'sub_2', code: 'BDA-LAB', name: 'Big Data Analytics Lab', credits: 2 },
    { id: 'sub_3', code: 'C&NS', name: 'Cryptography & Network Security', credits: 4 },
    { id: 'sub_4', code: 'CC', name: 'Cloud Computing', credits: 4 },
    { id: 'sub_5', code: 'EI', name: 'Electronic Instrumentation (OE-II)', credits: 3 },
    { id: 'sub_6', code: 'LIB', name: 'Library', credits: 1 },
    { id: 'sub_7', code: 'ML', name: 'Machine Learning', credits: 4 },
    { id: 'sub_8', code: 'SOC', name: 'SOC Skill Lab', credits: 2 },
    { id: 'sub_9', code: 'STM', name: 'Software Testing Methodologies', credits: 3 },
    { id: 'sub_10', code: 'TPR', name: 'Technical Paper Writing', credits: 1 }
];

export const mockUsers = {
    // Students (64 students)
    students: Array.from({ length: 64 }, (_, i) => {
        const rollSuffix = 101 + i;
        const rollNumber = `2310${String(rollSuffix)}`;
        const email = `${rollNumber}@skucet.edu`;

        let name = `Student ${rollSuffix}`;
        if (rollNumber === '2310101') name = 'Lochan Kumar';
        if (rollNumber === '2310126') name = 'M. Vijaya Lakhsmi';

        return {
            id: `student_${i + 1}`,
            email: email,
            password: rollNumber,
            name: name,
            role: 'student',
            rollNumber,
            branch: 'CSE',
            semester: 6,
            isFirstLogin: false
        };
    }),

    // Faculty
    faculty: {
        id: 'faculty_1',
        email: 'faculty.portal@skucet.edu',
        password: 'FacultyPortalLogin2026',
        name: 'Faculty Staff',
        role: 'faculty',
        employeeId: 'SHARED001',
        isFirstLogin: false
    },

    // Admin
    admin: {
        id: 'admin_1',
        email: 'admin.portal@skucet.edu',
        password: 'AdminPortalLogin2026',
        name: 'System Admin',
        role: 'admin',
        isFirstLogin: false
    }
};

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
    // Thursday
    { day: 'Thursday', period: 1, startTime: '09:30 AM', endTime: '10:30 AM', subjectName: 'Cryptography & Network Security', facultyName: 'Smt. Chandrakala' },
    { day: 'Thursday', period: 2, startTime: '10:30 AM', endTime: '11:30 AM', subjectName: 'Cloud Computing', facultyName: 'Dr. P R Rajesh Kumar' },
    { day: 'Thursday', period: 3, startTime: '11:30 AM', endTime: '12:30 PM', subjectName: 'Electronic Instrumentation', facultyName: 'Mr. D. Purushotam Reddy' },
    { day: 'Thursday', period: 4, startTime: '01:30 PM', endTime: '02:30 PM', subjectName: 'Big Data Analytics', facultyName: 'Smt. D Gousiya Begum' },
    { day: 'Thursday', period: 5, startTime: '02:30 PM', endTime: '03:30 PM', subjectName: 'Software Testing Methodologies', facultyName: 'Mr. U Dhanunjaya' },
    { day: 'Thursday', period: 6, startTime: '03:30 PM', endTime: '04:30 PM', subjectName: 'Library', facultyName: 'Dr. P R Rajesh Kumar' },

    // Friday
    { day: 'Friday', period: 1, startTime: '09:30 AM', endTime: '10:30 AM', subjectName: 'Electronic Instrumentation', facultyName: 'Mr. D. Purushotam Reddy' },
    { day: 'Friday', period: 2, startTime: '10:30 AM', endTime: '11:30 AM', subjectName: 'Machine Learning', facultyName: 'Smt. R. Sumathi' },
    { day: 'Friday', period: 3, startTime: '11:30 AM', endTime: '12:30 PM', subjectName: 'Big Data Analytics', facultyName: 'Smt. D Gousiya Begum' },
    { day: 'Friday', period: 4, startTime: '01:30 PM', endTime: '02:30 PM', subjectName: 'SOC Skill Lab', facultyName: 'Dr. Shakila' },
    { day: 'Friday', period: 5, startTime: '02:30 PM', endTime: '03:30 PM', subjectName: 'SOC Skill Lab', facultyName: 'Dr. Shakila' },
    { day: 'Friday', period: 6, startTime: '03:30 PM', endTime: '04:30 PM', subjectName: 'SOC Skill Lab', facultyName: 'Dr. Shakila' },

    // Saturday
    { day: 'Saturday', period: 1, startTime: '09:30 AM', endTime: '10:30 AM', subjectName: 'Cloud Computing', facultyName: 'Dr. P R Rajesh Kumar' },
    { day: 'Saturday', period: 2, startTime: '10:30 AM', endTime: '11:30 AM', subjectName: 'Electronic Instrumentation', facultyName: 'Mr. D. Purushotam Reddy' },
    { day: 'Saturday', period: 3, startTime: '11:30 AM', endTime: '12:30 PM', subjectName: 'Big Data Analytics', facultyName: 'Smt. D Gousiya Begum' },
    { day: 'Saturday', period: 4, startTime: '01:30 PM', endTime: '02:30 PM', subjectName: 'Cryptography & Network Security', facultyName: 'Smt. Chandrakala' },
    { day: 'Saturday', period: 5, startTime: '02:30 PM', endTime: '03:30 PM', subjectName: 'Technical Paper Writing', facultyName: 'Smt. D Gousiya Begum' },
    { day: 'Saturday', period: 6, startTime: '03:30 PM', endTime: '04:30 PM', subjectName: 'Technical Paper Writing', facultyName: 'Smt. D Gousiya Begum' },

    // Monday
    { day: 'Monday', period: 1, startTime: '09:30 AM', endTime: '10:30 AM', subjectName: 'Big Data Analytics', facultyName: 'Smt. D Gousiya Begum' },
    { day: 'Monday', period: 2, startTime: '10:30 AM', endTime: '11:30 AM', subjectName: 'Machine Learning', facultyName: 'Smt. R. Sumathi' },
    { day: 'Monday', period: 3, startTime: '11:30 AM', endTime: '12:30 PM', subjectName: 'Cloud Computing', facultyName: 'Dr. P R Rajesh Kumar' },
    { day: 'Monday', period: 4, startTime: '01:30 PM', endTime: '02:30 PM', subjectName: 'Software Testing Methodologies', facultyName: 'Mr. U Dhanunjaya' },
    { day: 'Monday', period: 5, startTime: '02:30 PM', endTime: '03:30 PM', subjectName: 'Cryptography & Network Security', facultyName: 'Smt. Chandrakala' },
    { day: 'Monday', period: 6, startTime: '03:30 PM', endTime: '04:30 PM', subjectName: 'Electronic Instrumentation', facultyName: 'Mr. D. Purushotam Reddy' },

    // Tuesday
    { day: 'Tuesday', period: 1, startTime: '09:30 AM', endTime: '10:30 AM', subjectName: 'Machine Learning', facultyName: 'Smt. R. Sumathi' },
    { day: 'Tuesday', period: 2, startTime: '10:30 AM', endTime: '11:30 AM', subjectName: 'Software Testing Methodologies', facultyName: 'Mr. U Dhanunjaya' },
    { day: 'Tuesday', period: 3, startTime: '11:30 AM', endTime: '12:30 PM', subjectName: 'Cryptography & Network Security', facultyName: 'Smt. Chandrakala' },
    { day: 'Tuesday', period: 4, startTime: '01:30 PM', endTime: '02:30 PM', subjectName: 'Big Data Analytics Lab', facultyName: 'Smt. D Gousiya Begum' },
    { day: 'Tuesday', period: 5, startTime: '02:30 PM', endTime: '03:30 PM', subjectName: 'Big Data Analytics Lab', facultyName: 'Smt. D Gousiya Begum' },
    { day: 'Tuesday', period: 6, startTime: '03:30 PM', endTime: '04:30 PM', subjectName: 'Big Data Analytics Lab', facultyName: 'Smt. D Gousiya Begum' },

    // Wednesday
    { day: 'Wednesday', period: 1, startTime: '09:30 AM', endTime: '10:30 AM', subjectName: 'Cloud Computing', facultyName: 'Dr. P R Rajesh Kumar' },
    { day: 'Wednesday', period: 2, startTime: '10:30 AM', endTime: '11:30 AM', subjectName: 'Electronic Instrumentation', facultyName: 'Mr. D. Purushotam Reddy' },
    { day: 'Wednesday', period: 3, startTime: '11:30 AM', endTime: '12:30 PM', subjectName: 'Machine Learning', facultyName: 'Smt. R. Sumathi' },
    { day: 'Wednesday', period: 4, startTime: '01:30 PM', endTime: '02:30 PM', subjectName: 'Software Testing Methodologies', facultyName: 'Mr. U Dhanunjaya' },
    { day: 'Wednesday', period: 5, startTime: '02:30 PM', endTime: '03:30 PM', subjectName: 'Library', facultyName: 'Dr. P R Rajesh Kumar' },
    { day: 'Wednesday', period: 6, startTime: '03:30 PM', endTime: '04:30 PM', subjectName: 'Technical Paper Writing', facultyName: 'Smt. D Gousiya Begum' },
];

// Mock announcements
export const mockAnnouncements = [
    {
        id: 'ann_1',
        title: 'Welcome to the New Semester',
        message: 'Classes for the 3rd Year 2nd Semester have commenced. Please check your timetable.',
        targetRole: 'student',
        subjectName: null,
        createdAt: new Date().toISOString(),
        createdBy: 'Admin'
    },
    {
        id: 'ann_2',
        title: 'Data Analytics Workshop',
        message: 'A workshop on Big Data using Hadoop will be conducted this Saturday. Interested students register with Smt. D Gousiya Begum.',
        targetRole: 'student',
        subjectName: 'Big Data Analytics',
        createdAt: new Date().toISOString(),
        createdBy: 'Smt. D Gousiya Begum'
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
