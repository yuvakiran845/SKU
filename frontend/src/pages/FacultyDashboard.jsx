import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { facultyAPI } from '../services/api';
import './FacultyDashboard.css';

const FacultyDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // === Subject (fixed — auto-fetched from registration) ===
    const [mySubject, setMySubject] = useState(null);

    // === Students ===
    const [students, setStudents] = useState([]);

    // === Attendance state ===
    const [attendance, setAttendance] = useState({}); // { studentId: true/false }
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [period, setPeriod] = useState(1);

    // === Smart mode ===
    const [attendanceMode, setAttendanceMode] = useState('create'); // 'create' | 'update'
    const [existingRecordId, setExistingRecordId] = useState(null);
    const [modeChecking, setModeChecking] = useState(false);

    // === Stats ===
    const [totalClassesConducted, setTotalClassesConducted] = useState(0);

    // === UI ===
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [timetable, setTimetable] = useState([]);
    const [activeTab, setActiveTab] = useState('attendance');
    const [lastSubmission, setLastSubmission] = useState(null);
    const [popup, setPopup] = useState({ show: false, message: '', type: '' });

    const showPopup = (message, type = 'success', duration = 3500) => {
        setPopup({ show: true, message, type });
        setTimeout(() => setPopup({ show: false, message: '', type: '' }), duration);
    };

    // =========================================================
    // INITIAL DATA LOAD
    // =========================================================
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setInitialLoading(true);
        try {
            // Fetch: My registered subject + timetable in parallel
            const [subjectRes, timetableRes] = await Promise.all([
                facultyAPI.getMySubject(),
                facultyAPI.getTimetable().catch(() => ({ data: { data: [] } }))
            ]);

            const subject = subjectRes.data.data;
            setMySubject(subject);
            setTimetable(timetableRes.data.data || []);

            if (subject) {
                // Fetch students for this subject
                const studentsRes = await facultyAPI.getStudentsBySubject(subject._id);
                const studentsData = studentsRes.data.data || [];
                setStudents(studentsData);

                // Initialize all absent
                const initial = {};
                studentsData.forEach(s => initial[s._id] = false);
                setAttendance(initial);

                // Check today's attendance mode
                await checkAndLoadAttendanceMode(subject._id, new Date().toISOString().split('T')[0], 1, studentsData);

                // Fetch total classes conducted
                fetchAttendanceSummary(subject._id);
            }
        } catch (error) {
            console.error('Error fetching faculty data:', error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                logout();
                navigate('/login');
            } else if (error.response?.status === 404) {
                // No subject registered — show registration prompt
                showPopup('No subject registered to your account. Please register first.', 'error', 6000);
            }
        } finally {
            setInitialLoading(false);
        }
    };

    // =========================================================
    // SMART MODE DETECTION
    // When date or period changes → check if attendance exists
    // =========================================================
    const checkAndLoadAttendanceMode = useCallback(async (subjectId, checkDate, checkPeriod, studentList) => {
        if (!subjectId) return;
        setModeChecking(true);
        try {
            const res = await facultyAPI.checkAttendance(subjectId, checkDate, checkPeriod);
            const { exists, mode, data: existingData } = res.data;

            setAttendanceMode(mode);
            setExistingRecordId(exists ? existingData._id : null);

            if (exists && existingData && existingData.records) {
                // Load existing attendance into state
                const loadedAttendance = {};
                const currentStudents = studentList || students;

                // Initialize all absent first
                currentStudents.forEach(s => loadedAttendance[s._id] = false);

                // Map existing records
                existingData.records.forEach(rec => {
                    const studentId = rec.student?._id || rec.student;
                    if (studentId) {
                        loadedAttendance[studentId] = rec.status === 'P';
                    }
                });
                setAttendance(loadedAttendance);
            } else {
                // Reset to all absent for fresh entry
                const currentStudents = studentList || students;
                const fresh = {};
                currentStudents.forEach(s => fresh[s._id] = false);
                setAttendance(fresh);
            }
        } catch (err) {
            console.error('Mode check error:', err);
            setAttendanceMode('create');
            setExistingRecordId(null);
        } finally {
            setModeChecking(false);
        }
    }, [students]);

    // React to date/period changes
    useEffect(() => {
        if (mySubject && students.length > 0 && !initialLoading) {
            checkAndLoadAttendanceMode(mySubject._id, date, period, students);
        }
    }, [date, period]);

    // =========================================================
    // TOTAL CLASSES SUMMARY
    // =========================================================
    const fetchAttendanceSummary = async (subjectId) => {
        try {
            const res = await facultyAPI.getAttendanceBySubject(subjectId);
            const records = res.data.data || [];
            setTotalClassesConducted(records.length);
        } catch (err) {
            console.error('Attendance summary error:', err);
        }
    };

    // =========================================================
    // ATTENDANCE TOGGLE
    // =========================================================
    const handleAttendanceChange = (studentId) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: !prev[studentId]
        }));
    };

    const handleMarkAllPresent = () => {
        const all = {};
        students.forEach(s => all[s._id] = true);
        setAttendance(all);
    };

    const handleMarkAllAbsent = () => {
        const all = {};
        students.forEach(s => all[s._id] = false);
        setAttendance(all);
    };

    const calculateStats = () => {
        const present = Object.values(attendance).filter(v => v).length;
        const total = students.length;
        const absent = total - present;
        return { present, absent, total };
    };

    // =========================================================
    // FINALIZE ATTENDANCE (smart upsert)
    // =========================================================
    const handleFinalize = async () => {
        if (!mySubject) {
            showPopup('No subject assigned to your account.', 'error');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                subjectId: mySubject._id,
                date,
                period,
                records: students.map(s => ({
                    student: s._id,
                    status: attendance[s._id] ? 'P' : 'A'
                }))
            };

            // Same endpoint — backend decides create vs update
            const res = await facultyAPI.markAttendance(payload);
            const isUpdate = res.data.mode === 'update';

            const stats = calculateStats();

            showPopup(
                isUpdate
                    ? `✅ Attendance updated! ${stats.present}/${stats.total} present`
                    : `✅ Attendance marked! ${stats.present}/${stats.total} present`,
                'success'
            );

            setLastSubmission({
                subjectName: mySubject.name,
                subjectCode: mySubject.code,
                date,
                period,
                stats,
                mode: isUpdate ? 'update' : 'create',
                timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            });

            // Update mode to 'update' since record now exists
            setAttendanceMode('update');

            // Refresh total classes count
            fetchAttendanceSummary(mySubject._id);

        } catch (error) {
            console.error('Finalize error:', error);
            const msg = error.response?.data?.message || 'Failed to save attendance';
            showPopup(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // =========================================================
    // TIMETABLE RENDER (same as student portal — all subjects)
    // =========================================================
    const renderTimetable = () => {
        const timeSlots = ["9:30-10:30", "10:30-11:30", "11:30-12:30", "LUNCH", "1:30-2:30", "2:30-3:30", "3:30-4:30"];
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        const periodMap = {
            "9:30-10:30": 1, "10:30-11:30": 2, "11:30-12:30": 3,
            "1:30-2:30": 4, "2:30-3:30": 5, "3:30-4:30": 6
        };

        const getSlotContent = (day, time) => {
            const periodIdx = periodMap[time];
            const found = timetable.find(t => t.day === day && t.period === periodIdx);
            if (!found) return <span style={{ color: '#cbd5e1', fontSize: '13px' }}>—</span>;
            const isMySubject = mySubject && found.subject?._id === mySubject._id;
            return (
                <div className="cell-content"
                    style={isMySubject ? { background: 'linear-gradient(135deg,#eff6ff,#f0fdf4)', borderRadius: '6px', padding: '2px 4px' } : {}}>
                    <div className="subject-code"
                        style={{ fontWeight: '800', color: isMySubject ? '#0ea5e9' : '#635bff', fontSize: '12px' }}>
                        {found.subject?.code || '—'}
                    </div>
                </div>
            );
        };

        const uniqueSubjects = [];
        const seenCodes = new Set();
        timetable.forEach(t => {
            if (t.subject && !seenCodes.has(t.subject.code)) {
                seenCodes.add(t.subject.code);
                uniqueSubjects.push({
                    code: t.subject.code,
                    name: t.subject.name,
                    faculty: t.faculty?.name || 'TBA',
                    isMe: mySubject && t.subject._id === mySubject._id
                });
            }
        });

        const filteredSubjects = uniqueSubjects
            .filter(s => s.code !== 'LIB' && s.name !== 'Library')
            .sort((a, b) => a.code.localeCompare(b.code));

        return (
            <div className="timetable-container-premium">
                <div className="table-wrapper">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th className="day-header">Day / Time</th>
                                {timeSlots.map((t, i) => (
                                    <th key={i} className={t === 'LUNCH' ? 'time-header lunch-header' : 'time-header'}>{t}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {days.map(day => (
                                <tr key={day}>
                                    <td className="day-cell">{day}</td>
                                    {timeSlots.map((time, idx) => {
                                        if (time === 'LUNCH') {
                                            return idx === 3 && day === 'Monday' ? (
                                                <td key="lunch" rowSpan={6} className="lunch-cell">
                                                    <div className="lunch-text">LUNCH BREAK</div>
                                                </td>
                                            ) : null;
                                        }
                                        return (
                                            <td key={idx} className="subject-cell">
                                                {getSlotContent(day, time)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="legend-section">
                    <h4>Subject &amp; Faculty Allocation
                        {mySubject && (
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#0ea5e9', marginLeft: '10px', padding: '2px 8px', background: '#eff6ff', borderRadius: '12px' }}>
                                ★ Your subject highlighted
                            </span>
                        )}
                    </h4>
                    <div className="legend-grid">
                        {filteredSubjects.map(sub => (
                            <div key={sub.code} className="legend-item"
                                style={sub.isMe ? { background: '#eff6ff', borderColor: '#7dd3fc', borderWidth: '2px', borderStyle: 'solid' } : {}}>
                                <span className="legend-code" style={{ fontWeight: 'bold', color: sub.isMe ? '#0ea5e9' : '#635bff', minWidth: '60px' }}>
                                    {sub.code}
                                </span>
                                <span className="legend-separator">-</span>
                                <div className="legend-details">
                                    <span className="legend-name">{sub.name}</span>
                                    <span className="legend-faculty" style={{ color: '#525f7f', fontStyle: 'italic', fontSize: '0.85rem' }}>{sub.faculty}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // =========================================================
    // INITIAL LOADING STATE
    // =========================================================
    if (initialLoading) {
        return (
            <div className="faculty-dashboard">
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '1rem',
                    background: '#f8fafc'
                }}>
                    <div style={{
                        width: '48px', height: '48px',
                        border: '4px solid #e2e8f0',
                        borderTop: '4px solid #0EA5E9',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                    }}></div>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    <p style={{ color: '#64748b', fontFamily: 'Inter, sans-serif', fontSize: '0.95rem' }}>
                        Loading your faculty dashboard...
                    </p>
                </div>
            </div>
        );
    }

    const stats = calculateStats();
    const presentPct = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

    return (
        <div className="faculty-dashboard">
            {/* NAVBAR */}
            <nav className="dashboard-navbar-premium">
                <div className="navbar-content">
                    <div className="navbar-brand">
                        <svg className="brand-logo-svg" width="40" height="40" viewBox="0 0 24 24" fill="none">
                            <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"
                                fill="url(#dash-logo-gradient)" />
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

                    {/* Subject badge in navbar */}
                    {mySubject && (
                        <div className="navbar-subject-badge">
                            <span className="subject-badge-code">{mySubject.code}</span>
                            <span className="subject-badge-name">{mySubject.name}</span>
                        </div>
                    )}

                    <div className="navbar-actions">
                        <button onClick={handleLogout} className="btn-logout">Logout</button>
                    </div>
                </div>
            </nav>

            {/* POPUP NOTIFICATION */}
            {popup.show && (
                <div className={`popup-notification ${popup.type}`}>
                    {popup.message}
                </div>
            )}

            {/* LOADING OVERLAY */}
            {loading && (
                <div className="loading-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.75)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="spinner" style={{
                        width: '44px', height: '44px',
                        border: '4px solid #e2e8f0', borderTop: '4px solid #0EA5E9',
                        borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                    }}></div>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            <div className="dashboard-main-premium">

                {/* SUBJECT SUMMARY CARDS */}
                {mySubject && (
                    <div className="faculty-stats-row">
                        <div className="fstat-card subject-card">
                            <div className="fstat-icon-wrap subject-icon">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <div className="fstat-body">
                                <div className="fstat-label">Your Subject</div>
                                <div className="fstat-value subject-name-val">{mySubject.name}</div>
                                <div className="fstat-sub">{mySubject.code} &bull; Sem {mySubject.semester} &bull; {mySubject.branch}</div>
                            </div>
                        </div>

                        <div className="fstat-card">
                            <div className="fstat-icon-wrap classes-icon">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <div className="fstat-body">
                                <div className="fstat-label">Classes Conducted</div>
                                <div className="fstat-value">{totalClassesConducted}</div>
                                <div className="fstat-sub">Total this semester</div>
                            </div>
                        </div>

                        <div className="fstat-card">
                            <div className="fstat-icon-wrap students-icon">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <div className="fstat-body">
                                <div className="fstat-label">Total Students</div>
                                <div className="fstat-value">{students.length}</div>
                                <div className="fstat-sub">{mySubject.branch} Sem {mySubject.semester}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MAIN PANEL */}
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

                                {/* Subject header — no dropdown, just display */}
                                {mySubject && (
                                    <div className="subject-display-header">
                                        <div className="sdh-left">
                                            <div className="sdh-badge">{mySubject.code}</div>
                                            <div className="sdh-info">
                                                <span className="sdh-name">{mySubject.name}</span>
                                                <span className="sdh-meta">Semester {mySubject.semester} &bull; {mySubject.branch}</span>
                                            </div>
                                        </div>
                                        {/* Smart Mode Indicator */}
                                        <div className={`mode-badge ${attendanceMode}`}>
                                            {modeChecking ? (
                                                <span className="mode-checking">Checking...</span>
                                            ) : attendanceMode === 'update' ? (
                                                <>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                    Update Mode
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                                                    </svg>
                                                    New Entry
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Controls row — Date and Period only (NO subject dropdown) */}
                                <div className="controls-row">
                                    <div className="control-group">
                                        <label>Date</label>
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            style={{ border: '2px solid #e2e8f0', fontWeight: '500' }}
                                        />
                                    </div>
                                    <div className="control-group">
                                        <label>Period</label>
                                        <select
                                            value={period}
                                            onChange={(e) => setPeriod(Number(e.target.value))}
                                            style={{ border: '2px solid #e2e8f0', fontWeight: '500' }}
                                        >
                                            {[1, 2, 3, 4, 5, 6].map(p => (
                                                <option key={p} value={p}>Period {p}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Quick mark buttons */}
                                    <div className="control-group quick-buttons">
                                        <label>Quick Actions</label>
                                        <div className="quick-btn-row">
                                            <button className="btn-all-present" onClick={handleMarkAllPresent} title="Mark all present">
                                                ✓ All Present
                                            </button>
                                            <button className="btn-all-absent" onClick={handleMarkAllAbsent} title="Mark all absent">
                                                ✗ All Absent
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Update mode info banner */}
                                {attendanceMode === 'update' && !modeChecking && (
                                    <div className="update-mode-banner">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                                        </svg>
                                        <span>
                                            <strong>Existing attendance found</strong> for {date}, Period {period}.
                                            Any changes you make will <strong>update</strong> the existing record — no duplicate entry will be created.
                                        </span>
                                    </div>
                                )}

                                {/* Legend */}
                                <div className="attendance-legend">
                                    <div className="legend-tag present-tag">
                                        <span className="legend-dot present-dot"></span> Click to toggle. Green = Present, Red = Absent
                                    </div>
                                    <div className="legend-tag absent-tag">
                                        Unmarked = Absent
                                    </div>
                                </div>

                                {/* Students grid */}
                                <div className="students-grid-wrapper">
                                    {students.length === 0 ? (
                                        <div className="no-students-msg">
                                            <p>No students found for this subject.</p>
                                        </div>
                                    ) : (
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
                                    )}
                                </div>

                                {/* Action Footer */}
                                <div className="action-footer">
                                    <div className="summary-finalize-row">
                                        <div className="summary">
                                            <span className="count-present">Present: {stats.present}</span>
                                            <span className="count-absent">Absent: {stats.absent}</span>
                                            <span className="count-total">Total: {stats.total}</span>
                                            <span className={`pct-badge ${presentPct >= 75 ? 'good' : 'low'}`}>
                                                {presentPct}%
                                            </span>
                                        </div>
                                        <button
                                            className={`btn-finalize ${attendanceMode === 'update' ? 'update-mode' : ''}`}
                                            onClick={handleFinalize}
                                            disabled={students.length === 0}
                                        >
                                            {attendanceMode === 'update'
                                                ? '✎ Update Attendance'
                                                : '✓ Finalize Attendance'}
                                        </button>
                                    </div>

                                    {/* Last submission summary */}
                                    {lastSubmission && (
                                        <div className="submission-summary fade-in">
                                            <div className="ls-header">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                <strong>
                                                    Attendance {lastSubmission.mode === 'update' ? 'Updated' : 'Submitted'} Successfully
                                                </strong>
                                                <span className="ls-time">{lastSubmission.timestamp}</span>
                                            </div>
                                            <div className="ls-details">
                                                <span className="ls-subject">{lastSubmission.subjectCode} – {lastSubmission.subjectName}</span>
                                                <span className="ls-sep">•</span>
                                                <span>{lastSubmission.date}</span>
                                                <span className="ls-sep">•</span>
                                                <span>Period {lastSubmission.period}</span>
                                                <span className="ls-sep">•</span>
                                                <strong className="ls-stat">{lastSubmission.stats.present}/{lastSubmission.stats.total} Present</strong>
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
