import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../services/api';
import './StudentDashboard.css';

const StudentDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showProfileModal, setShowProfileModal] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [profileRes, attendanceRes, timetableRes] =
                await Promise.all([
                    studentAPI.getProfile(),
                    studentAPI.getAttendance(),
                    studentAPI.getTimetable(),
                ]);

            setProfile(profileRes.data.data || profileRes.data); // Handle both if needed, but data.data is consistent with new backend logic
            setAttendance(attendanceRes.data.data || attendanceRes.data); // Attendance controller might still return direct data, let's keep it safe

            // Timetable controller returns slots array directly in .data or .data.data? 
            // Faculty controller returned { success: true, data: [...] }. 
            // Student controller likely similar.
            setTimetable(timetableRes.data.data || timetableRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getAttendanceStatus = (percentage) => {
        if (percentage >= 75) return 'excellent';
        if (percentage >= 65) return 'good';
        if (percentage >= 50) return 'warning';
        return 'critical';
    };

    const calculateOverallAttendance = () => {
        if (!attendance || attendance.length === 0) return 0;

        // Filter out Library
        const validSubjects = attendance.filter(sub => sub.subjectName !== 'Library' && sub.subjectCode !== 'LIB');

        // Calculate total present and total classes across all subjects
        const totalPresent = validSubjects.reduce((sum, sub) => sum + (Number(sub.present) || 0), 0);
        const totalClasses = validSubjects.reduce((sum, sub) => sum + (Number(sub.total) || 0), 0);

        if (totalClasses === 0) return 0;

        return ((totalPresent / totalClasses) * 100).toFixed(2);
    };

    const calculateMonthlyAttendance = () => {
        // Mock logic: Returns 0 as requested "month wise attendance will become zero when month changes"
        // In a real app, we'd filter attendance logs by current month.
        // For now, we return 0 to simulate the "new month" state or separate box behavior.
        return 0;
    };

    // Helper to get full subject name from short codes if necessary
    const getFullSubjectName = (shortName) => {
        return shortName; // Pass through, or add logic if needed.
    };

    const getTodaySchedule = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];

        const todayItems = timetable.filter(item => item.day === today);

        // Sort by period
        todayItems.sort((a, b) => a.period - b.period);

        return todayItems.map(item => ({
            ...item,
            subjectName: item.subject?.name || item.subjectCode || 'Unknown Subject',
            facultyName: item.faculty?.name || 'Unknown Faculty'
        }));
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    const overallAttendance = calculateOverallAttendance();
    const todaySchedule = getTodaySchedule();

    const renderTimetable = () => {
        const timeSlots = [
            "9:30-10:30", "10:30-11:30", "11:30-12:30",
            "LUNCH",
            "1:30-2:30", "2:30-3:30", "3:30-4:30"
        ];

        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        const getSubjectForSlot = (day, time) => {
            const periodMap = {
                "9:30-10:30": 1,
                "10:30-11:30": 2,
                "11:30-12:30": 3,
                "1:30-2:30": 4,
                "2:30-3:30": 5,
                "3:30-4:30": 6
            };

            const period = periodMap[time];
            const found = timetable.find(t => t.day === day && t.period === period);
            // Return Subject Code or Name
            return found ? (
                <div className="cell-content">
                    <div className="subject-code" style={{ fontWeight: 'bold', color: '#635bff' }}>{found.subject?.code || found.subjectName || '-'}</div>
                </div>
            ) : "-";
        };

        // Generate Legend Data matching Faculty Dashboard
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

        // Remove Library from Legend
        const filteredSubjects = uniqueSubjects.filter(s => s.code !== 'LIB' && s.name !== 'Library');

        filteredSubjects.sort((a, b) => a.code.localeCompare(b.code));

        return (
            <div className="timetable-container-premium">
                <div className="table-wrapper">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th className="day-header">Day / Time</th>
                                {timeSlots.map((time, index) => (
                                    <th key={index} className={time === "LUNCH" ? "time-header lunch-header" : "time-header"}>
                                        {time}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {days.map((day) => (
                                <tr key={day}>
                                    <td className="day-cell">{day}</td>
                                    {timeSlots.map((time, index) => {
                                        if (time === "LUNCH") {
                                            return index === 3 && day === "Monday" ? (
                                                <td key="lunch" rowSpan={6} className="lunch-cell">
                                                    <div className="lunch-text">LUNCH BREAK</div>
                                                </td>
                                            ) : null;
                                        }
                                        return (
                                            <td key={index} className="subject-cell">
                                                {getSubjectForSlot(day, time)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Faculty Legend */}
                <div className="timetable-legend" style={{ marginTop: '2rem', background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#0a2540', borderBottom: '1px solid #e1e4e8', paddingBottom: '0.5rem' }}>Subject & Faculty Allocation</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {filteredSubjects.map(sub => (
                            <div key={sub.code} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <span style={{ fontWeight: 'bold', color: '#635bff', minWidth: '60px' }}>{sub.code}</span>
                                <span style={{ color: '#8898aa', marginRight: '0.5rem' }}>-</span>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', color: '#32325d' }}>{sub.name}</span>
                                    <span style={{ color: '#525f7f', fontStyle: 'italic', fontSize: '0.85rem' }}>{sub.faculty}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard-container-premium">
            {/* Navbar */}
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
                            <p>Student Portal</p>
                        </div>
                    </div>

                    <div className="navbar-actions">
                        <div
                            className="user-info clickable"
                            onClick={() => setShowProfileModal(true)}
                            title="View profile"
                            aria-label="Open profile"
                        >
                            <div className="user-avatar">
                                {profile?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-details">
                                <p className="user-name">{profile?.name}</p>
                                <p className="user-role">{profile?.rollNumber}</p>
                            </div>
                            <svg className="nav-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>
                        <button onClick={handleLogout} className="btn-logout">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Student Profile</h3>
                            <button className="close-btn" onClick={() => setShowProfileModal(false)}>×</button>
                        </div>
                        <div className="profile-details">
                            <div className="profile-avatar-large">
                                {profile?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Full Name</span>
                                <span className="detail-value">{profile?.name}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Roll Number</span>
                                <span className="detail-value">{profile?.rollNumber}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Email</span>
                                <span className="detail-value">{user?.email || 'N/A'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Department</span>
                                <span className="detail-value">Computer Science & Engineering</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Semester</span>
                                <span className="detail-value">III Year - II Semester</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="dashboard-main-premium">
                {/* Tabs */}
                <div className="tabs-container">
                    <button
                        className={`tab-btn-premium ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`tab-btn-premium ${activeTab === 'attendance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('attendance')}
                    >
                        Attendance
                    </button>
                    <button
                        className={`tab-btn-premium ${activeTab === 'timetable' ? 'active' : ''}`}
                        onClick={() => setActiveTab('timetable')}
                    >
                        Timetable
                    </button>
                    <button
                        className={`tab-btn-premium ${activeTab === 'announcements' ? 'active' : ''}`}
                        onClick={() => setActiveTab('announcements')}
                    >
                        Announcements
                    </button>
                </div>

                <div className="content-area">
                    {activeTab === 'overview' && (
                        <div className="overview-section fade-in">
                            {/* Two Main Cards */}
                            {/* Three Main Cards */}
                            <div className="overview-cards">
                                {/* Cumulative Attendance */}
                                <div className="info-card attendance-card-main" onClick={() => setActiveTab('attendance')}>
                                    <div className="card-icon blue">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                    </div>
                                    <div className="card-data">
                                        <h3>Overall Semester Attendance</h3>
                                        <div className="big-number">{calculateOverallAttendance()}%</div>
                                        <p>(Cumulative)</p>
                                    </div>
                                </div>

                                {/* Month-wise Attendance Box */}
                                <div className="info-card attendance-card-main" onClick={() => setActiveTab('attendance')}>
                                    <div className="card-icon blue">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="card-data">
                                        <h3>Month-wise Attendance</h3>
                                        <div className="big-number">{calculateMonthlyAttendance()}%</div>
                                        <p>(Resets Monthly - Current: {new Date().toLocaleString('default', { month: 'long' })})</p>
                                    </div>
                                </div>

                                {/* Today's Classes */}
                                <div
                                    className="info-card classes-card-main"
                                    onClick={() => setActiveTab('timetable')}
                                >
                                    <div className="card-icon purple">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="card-data">
                                        <h3>Today's Classes</h3>
                                        <div className="big-number">{todaySchedule.length}</div>
                                        <p>Scheduled for today</p>
                                    </div>
                                </div>
                            </div>

                            {/* Today's Schedule List */}
                            <div className="today-schedule-section">
                                <div className="section-header-premium">
                                    <h3>Today's Schedule</h3>
                                    <span className="date-badge">
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                                <div className="schedule-timeline">
                                    {todaySchedule.length > 0 ? (
                                        todaySchedule.map((item, index) => (
                                            <div key={index} className="timeline-item">
                                                <div className="time-col">
                                                    <span className="time-start">{item.startTime}</span>
                                                    <span className="time-end">{item.endTime}</span>
                                                </div>
                                                <div className="class-line-indicator"></div>
                                                <div className="class-details">
                                                    <h4>{item.subjectName}</h4>
                                                    <p>{item.facultyName} • Period {item.period}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-state-premium">
                                            <p>No classes scheduled for today. Enjoy your day!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <div className="attendance-section fade-in">
                            <div className="section-header-premium">
                                <h3>Total Attendance Records</h3>
                                <p>Monthly Attendance resets automatically on the 1st of every month.</p>
                            </div>
                            <div className="attendance-header-summary" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                                <div className="summary-box" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', flex: 1, border: '1px solid #e3e8ee' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#525f7f' }}>Total Yearly (Cumulative)</h4>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#32325d' }}>{calculateOverallAttendance()}%</div>
                                </div>
                                <div className="summary-box" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', flex: 1, border: '1px solid #e3e8ee' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#525f7f' }}>Month-wise ({new Date().toLocaleString('default', { month: 'short' })})</h4>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00d4ff' }}>{calculateMonthlyAttendance()}%</div>
                                </div>
                            </div>
                            <div className="section-header-premium">
                                <h3>Subject-wise Attendance</h3>
                                <p>Minimum 75% required</p>
                            </div>
                            <div className="attendance-grid-premium">
                                {attendance.map((subject, index) => (
                                    <div key={index} className={`subject-card ${getAttendanceStatus(subject.percentage)}`}>
                                        <div className="subject-header">
                                            <h4>{getFullSubjectName(subject.subjectName)}</h4>
                                        </div>

                                        <div className="progress-track-container">
                                            <div className="progress-track">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${subject.percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="percentage-text">{subject.percentage}%</span>
                                        </div>

                                        <div className="subject-stats">
                                            <div className="stat-pill present">
                                                <span className="label">Present</span>
                                                <span className="value">{subject.present}</span>
                                            </div>
                                            <div className="stat-pill absent">
                                                <span className="label">Absent</span>
                                                <span className="value">{subject.absent}</span>
                                            </div>
                                            <div className="stat-pill total">
                                                <span className="label">Total</span>
                                                <span className="value">{subject.total}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'timetable' && (
                        <div className="timetable-section fade-in">
                            <div className="section-header-premium">
                                <h3>Total Attendance Records</h3>
                                <p>Monthly Attendance resets automatically on the 1st of every month.</p>
                            </div>
                            <div className="attendance-header-summary" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                                <div className="summary-box" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', flex: 1, border: '1px solid #e3e8ee' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#525f7f' }}>Cumulative (Year)</h4>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#32325d' }}>{calculateOverallAttendance()}%</div>
                                </div>
                                <div className="summary-box" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', flex: 1, border: '1px solid #e3e8ee' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#525f7f' }}>This Month ({new Date().toLocaleString('default', { month: 'short' })})</h4>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00d4ff' }}>{calculateMonthlyAttendance()}%</div>
                                </div>
                            </div>
                            <div className="section-header-premium">
                                <h3>Subject-wise Attendance</h3>
                                <p>Minimum 75% required</p>
                            </div>
                            {renderTimetable()}
                        </div>
                    )}

                    {activeTab === 'announcements' && (
                        <div className="announcements-section fade-in">
                            <div className="empty-announcement-state">
                                <div className="empty-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <h3>No Announcements</h3>
                                <p>There are no new updates at this time. Check back later.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default StudentDashboard;
