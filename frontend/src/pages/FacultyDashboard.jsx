import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { facultyAPI } from '../services/api';
import './FacultyDashboard.css';

const FacultyDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [period, setPeriod] = useState(1);
    const [loading, setLoading] = useState(false);
    const [timetable, setTimetable] = useState([]);
    const [activeTab, setActiveTab] = useState('attendance');
    const [lastSubmission, setLastSubmission] = useState(null);
    const [showPopup, setShowPopup] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedSubject) {
            fetchStudents(selectedSubject._id);
        }
    }, [selectedSubject]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [subjectsRes, timetableRes] = await Promise.all([
                facultyAPI.getSubjects(),
                facultyAPI.getTimetable()
            ]);

            const subjectsData = subjectsRes.data.data || [];
            const timetableData = timetableRes.data.data || [];

            setSubjects(subjectsData);
            if (subjectsData.length > 0) {
                // Determine if we should pre-select a subject? 
                // Given the new "Shared" nature, maybe don't auto-select to force user choice?
                // But for now let's select first to avoid null errors if any code expects it.
                // Or better, let it be null and force selection.
                // Keeping logic:
                setSelectedSubject(subjectsData[0]);
            }
            setTimetable(timetableData);
        } catch (error) {
            console.error("Error fetching data", error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                logout();
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async (subjectId) => {
        try {
            const res = await facultyAPI.getStudentsBySubject(subjectId);
            const studentsData = res.data.data || [];
            setStudents(studentsData);
            // Reset attendance
            const initial = {};
            studentsData.forEach(s => initial[s._id] = false);
            setAttendance(initial);
        } catch (error) {
            console.error("Error fetching students", error);
        }
    };

    const handleAttendanceChange = (studentId) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: !prev[studentId]
        }));
    };

    const calculateStats = () => {
        const present = Object.values(attendance).filter(v => v).length;
        const total = students.length;
        const absent = total - present;
        return { present, absent, total };
    };

    const handleFinalize = async () => {
        const stats = calculateStats();

        // Basic validation: Check if stats exist (which they do if calculateStats works)
        // Check if subject is selected
        if (!selectedSubject) {
            setShowPopup({ show: true, message: 'Please select a subject', type: 'warning' });
            setTimeout(() => setShowPopup({ show: false, message: '', type: '' }), 3000);
            return;
        }

        if (stats.present === 0 && stats.absent === stats.total) {
            setShowPopup({ show: true, message: 'Please take attendance first', type: 'warning' });
            setTimeout(() => setShowPopup({ show: false, message: '', type: '' }), 3000);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                subjectId: selectedSubject._id,
                date,
                period,
                records: students.map(s => ({
                    student: s._id,
                    status: attendance[s._id] ? 'P' : 'A'
                }))
            };

            await facultyAPI.markAttendance(payload);

            setShowPopup({ show: true, message: 'Attendance submitted successfully', type: 'success' });

            // Set Last Submission Details
            setLastSubmission({
                subjectName: selectedSubject.name,
                facultyName: selectedSubject.faculty?.name || 'Unknown Faculty',
                date: date,
                stats: stats
            });

        } catch (error) {
            console.error("Submission error", error);
            setShowPopup({ show: true, message: 'Failed to submit attendance', type: 'error' });
        } finally {
            setLoading(false);
            setTimeout(() => setShowPopup({ show: false, message: '', type: '' }), 3000);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const renderTimetable = () => {
        const timeSlots = ["9:30-10:30", "10:30-11:30", "11:30-12:30", "LUNCH", "1:30-2:30", "2:30-3:30", "3:30-4:30"];
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        const getSlotContent = (day, periodIndex) => {
            const found = timetable.find(t => t.day === day && t.period === periodIndex);
            return found ? (
                <div className="cell-content">
                    <div className="subject-code">{found.subject?.code || found.subjectName || '-'}</div>
                </div>
            ) : '-';
        };

        // Generate Legend Data
        const uniqueSubjects = [];
        const seenCodes = new Set();

        timetable.forEach(t => {
            if (t.subject && !seenCodes.has(t.subject.code)) {
                seenCodes.add(t.subject.code);
                uniqueSubjects.push({
                    code: t.subject.code,
                    name: t.subject.name,
                    faculty: t.faculty?.name || 'Unknown'
                });
            }
        });

        // Filter out Library
        const filteredSubjects = uniqueSubjects.filter(s => s.code !== 'LIB' && s.name !== 'Library');

        filteredSubjects.sort((a, b) => a.code.localeCompare(b.code));

        return (
            <div className="timetable-container-premium">
                <div className="table-wrapper">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th className="day-header">Day / Time</th>
                                {timeSlots.map((t, i) => <th key={i}>{t}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {days.map(day => (
                                <tr key={day}>
                                    <td className="day-cell">{day}</td>
                                    <td className="subject-cell">{getSlotContent(day, 1)}</td>
                                    <td className="subject-cell">{getSlotContent(day, 2)}</td>
                                    <td className="subject-cell">{getSlotContent(day, 3)}</td>

                                    {day === 'Monday' && (
                                        <td rowSpan={6} className="lunch-cell">
                                            <div className="lunch-text">LUNCH BREAK</div>
                                        </td>
                                    )}

                                    <td className="subject-cell">{getSlotContent(day, 4)}</td>
                                    <td className="subject-cell">{getSlotContent(day, 5)}</td>
                                    <td className="subject-cell">{getSlotContent(day, 6)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="legend-section">
                    <h4>Subject & Faculty Allocation</h4>
                    <div className="legend-grid">
                        {filteredSubjects.map(sub => (
                            <div key={sub.code} className="legend-item">
                                <span className="legend-code">{sub.code}</span>
                                <span className="legend-separator">-</span>
                                <div className="legend-details">
                                    <span className="legend-name">{sub.name}</span>
                                    <span className="legend-faculty">{sub.faculty}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="faculty-dashboard">
            <nav className="dashboard-navbar-premium">
                <div className="navbar-content">
                    <div className="navbar-brand">
                        <svg className="brand-logo-svg" width="40" height="40" viewBox="0 0 24 24" fill="none">
                            <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" fill="url(#dash-logo-gradient)" />
                            <defs>
                                <linearGradient id="dash-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#0EA5E9" />
                                    <stop offset="100%" stopColor="#10B981" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div>
                            <h2>SKUCET</h2>
                            <p>Faculty Portal</p>
                        </div>
                    </div>
                    <div className="navbar-actions">
                        <button onClick={handleLogout} className="btn-logout">Logout</button>
                    </div>
                </div>
            </nav>

            {showPopup.show && (
                <div className={`popup-notification ${showPopup.type}`}>
                    {showPopup.message}
                </div>
            )}

            {loading && (
                <div className="loading-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.8)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="spinner" style={{
                        width: '40px', height: '40px',
                        border: '4px solid #f3f3f3', borderTop: '4px solid #3498db',
                        borderRadius: '50%', animation: 'spin 1s linear infinite'
                    }}></div>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            <div className="dashboard-main-premium">


                <div className="panel-container">
                    <div className="panel-header">
                        <button
                            className={`panel-tab ${activeTab === 'attendance' ? 'active' : ''}`}
                            onClick={() => setActiveTab('attendance')}
                        >
                            Mark Attendance
                        </button>
                        <button
                            className={`panel-tab ${activeTab === 'timetable' ? 'active' : ''}`}
                            onClick={() => setActiveTab('timetable')}
                        >
                            Timetable
                        </button>
                    </div>

                    <div className="panel-content">
                        {activeTab === 'attendance' && (
                            <div className="attendance-interface">
                                <div className="controls-row">
                                    <div className="control-group">
                                        <label>Select Subject</label>
                                        <select
                                            value={selectedSubject?._id || ''}
                                            onChange={(e) => setSelectedSubject(subjects.find(s => s._id === e.target.value))}
                                            style={{ border: '2px solid black', fontWeight: '500' }}
                                        >
                                            <option value="" disabled>Select a subject</option>
                                            {subjects.map(s => {
                                                let facultyName = 'Unknown Faculty';
                                                if (s.faculty && s.faculty.name) {
                                                    facultyName = s.faculty.name;
                                                }
                                                return (
                                                    <option key={s._id} value={s._id}>
                                                        {s.name} ({s.code}) - {facultyName}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div className="control-group">
                                        <label>Date</label>
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            style={{ border: '2px solid black', fontWeight: '500' }}
                                        />
                                    </div>
                                    <div className="control-group">
                                        <label>Period</label>
                                        <select
                                            value={period}
                                            onChange={(e) => setPeriod(Number(e.target.value))}
                                            style={{ border: '2px solid black', fontWeight: '500' }}
                                        >
                                            {[1, 2, 3, 4, 5, 6].map(p => <option key={p} value={p}>Period {p}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="students-grid-wrapper">
                                    <div className="students-grid">
                                        {students.map(student => (
                                            <div
                                                key={student._id}
                                                className={`student-card ${attendance[student._id] ? 'present' : 'absent'}`}
                                                onClick={() => handleAttendanceChange(student._id)}
                                            >
                                                <div className="student-roll">{student.rollNumber}</div>
                                                <div className="student-name">{student.name}</div>
                                                <div className="status-badge">
                                                    {attendance[student._id] ? 'PRESENT' : 'ABSENT'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="action-footer" style={{ flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div className="summary">
                                            <span className="count-present">Present: {calculateStats().present}</span>
                                            <span className="count-absent">Absent: {calculateStats().absent}</span>
                                        </div>
                                        <button className="btn-finalize" onClick={handleFinalize}>
                                            Finalize Attendance
                                        </button>
                                    </div>

                                    {lastSubmission && (
                                        <div className="submission-summary fade-in" style={{
                                            width: '100%',
                                            padding: '1.5rem',
                                            background: '#f0fdf4',
                                            border: '1px solid #22c55e',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#15803d' }}>Attendance Submitted Successfully</h4>
                                                <div style={{ color: '#166534', fontSize: '0.95rem' }}>
                                                    <strong>{lastSubmission.subjectName}</strong>
                                                    <span style={{ margin: '0 0.5rem' }}>•</span>
                                                    <span>{lastSubmission.facultyName}</span>
                                                    <span style={{ margin: '0 0.5rem' }}>•</span>
                                                    <span>{lastSubmission.date}</span>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#166534' }}>
                                                    {lastSubmission.stats.present} / {lastSubmission.stats.total} Present
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'timetable' && renderTimetable()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyDashboard;
