
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import Toast from '../components/Toast';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // -- State --
    const [stats, setStats] = useState(null);
    const [students, setStudents] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [timetable, setTimetable] = useState(null);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [toasts, setToasts] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Modals
    const [showTimetableModal, setShowTimetableModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [userModalType, setUserModalType] = useState('student');
    const [formData, setFormData] = useState({});
    const [actionLoading, setActionLoading] = useState(false);

    // Confirm dialog
    const [confirmDialog, setConfirmDialog] = useState(null);

    const addToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 4000);
    };
    const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    useEffect(() => { fetchAllData(); }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [statsRes, studentsRes, facultyRes, subjectsRes, timetableRes] = await Promise.all([
                adminAPI.getSystemStats(),
                adminAPI.getAllStudents({ limit: 1000 }),
                adminAPI.getAllFaculty({ limit: 100 }),
                adminAPI.getAllSubjects(),
                adminAPI.getTimetable()
            ]);
            setStats(statsRes.data.data || statsRes.data);
            setStudents(studentsRes.data.data?.students || studentsRes.data.students || []);
            setFaculty(facultyRes.data.data?.faculty || facultyRes.data.faculty || []);
            setSubjects(subjectsRes.data.data || subjectsRes.data || []);
            setTimetable(timetableRes.data.data || timetableRes.data);
        } catch (error) {
            console.error("Error loading admin data", error);
        } finally {
            setLoading(false);
        }
    };

    // -- Timetable Logic --
    const handleSlotClick = (day, period) => {
        const existing = timetable?.slots?.find(s => s.day === day && s.period === period);
        setSelectedSlot({
            day, period,
            subjectId: existing?.subject?._id || '',
            facultyId: existing?.faculty?._id || ''
        });
        setShowTimetableModal(true);
    };

    const saveTimetableSlot = async () => {
        setActionLoading(true);
        try {
            let finalSubjectId = selectedSlot.subjectId;
            let finalFacultyId = selectedSlot.facultyId;

            if (selectedSlot.isNewSubject) {
                if (!selectedSlot.newSubjectName || !selectedSlot.newSubjectCode) {
                    addToast('Please enter Subject Name and Code', 'error'); return;
                }
                const subRes = await adminAPI.createSubject({
                    name: selectedSlot.newSubjectName,
                    code: selectedSlot.newSubjectCode,
                    credits: 3, semester: 1, branch: 'CSE'
                });
                finalSubjectId = subRes.data.data._id;
            }
            if (selectedSlot.isNewFaculty) {
                if (!selectedSlot.newFacultyName || !selectedSlot.newFacultyId) {
                    addToast('Please enter Faculty Name and ID', 'error'); return;
                }
                const facRes = await adminAPI.createFaculty({
                    name: selectedSlot.newFacultyName,
                    employeeId: selectedSlot.newFacultyId,
                    email: `${selectedSlot.newFacultyId.toLowerCase()}@sku.edu`,
                    password: 'password123'
                });
                finalFacultyId = facRes.data.data._id;
            }

            const res = await adminAPI.updateTimetableSlot({
                timetableId: timetable._id,
                day: selectedSlot.day,
                period: selectedSlot.period,
                subjectId: finalSubjectId,
                facultyId: finalFacultyId
            });
            setTimetable(res.data.data);

            // Refresh subjects + faculty lists after update (so faculty register dropdown auto-updates)
            const [subRes, facRes] = await Promise.all([
                adminAPI.getAllSubjects(),
                adminAPI.getAllFaculty({ limit: 100 })
            ]);
            setSubjects(subRes.data.data || []);
            setFaculty(facRes.data.data?.faculty || []);

            setShowTimetableModal(false);
            addToast('✅ Timetable updated! Subject list is now refreshed.', 'success');
        } catch (error) {
            addToast('Failed to update timetable', 'error');
        } finally { setActionLoading(false); }
    };

    // -- Remove Faculty --
    const handleRemoveFaculty = (f) => {
        setConfirmDialog({
            title: 'Remove Faculty',
            message: `Remove "${f.name}"? Their subject will be made available for new faculty registration.`,
            danger: true,
            onConfirm: async () => {
                setConfirmDialog(null);
                try {
                    await adminAPI.deleteFaculty(f._id);
                    setFaculty(prev => prev.filter(x => x._id !== f._id));
                    const statsRes = await adminAPI.getSystemStats();
                    setStats(statsRes.data.data);
                    addToast(`✅ ${f.name} removed. Subject is now open for registration.`, 'success');
                } catch (e) {
                    addToast('Failed to remove faculty', 'error');
                }
            }
        });
    };

    // -- Reset All Attendance --
    const handleResetAttendance = () => {
        setConfirmDialog({
            title: '⚠️ Reset All Attendance',
            message: 'This will permanently delete ALL attendance records for ALL students. Use at the start of a new semester. This cannot be undone.',
            danger: true,
            onConfirm: async () => {
                setConfirmDialog(null);
                try {
                    const res = await adminAPI.resetAllAttendance();
                    addToast(`✅ ${res.data.message}`, 'success');
                    fetchAllData();
                } catch (e) {
                    addToast('Failed to reset attendance', 'error');
                }
            }
        });
    };

    // -- User/Entity Modal --
    const openCreateModal = (type) => { setUserModalType(type); setFormData({}); setShowUserModal(true); };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            if (userModalType === 'student') {
                await adminAPI.createStudent(formData);
                const res = await adminAPI.getAllStudents({ limit: 1000 });
                setStudents(res.data.data?.students || []);
            } else if (userModalType === 'faculty') {
                await adminAPI.createFaculty(formData);
                const res = await adminAPI.getAllFaculty({ limit: 100 });
                setFaculty(res.data.data?.faculty || []);
            } else if (userModalType === 'subject') {
                await adminAPI.createSubject(formData);
                const res = await adminAPI.getAllSubjects();
                setSubjects(res.data.data || []);
            }
            setShowUserModal(false);
            addToast(`✅ ${userModalType.charAt(0).toUpperCase() + userModalType.slice(1)} created successfully!`, 'success');
            const statsRes = await adminAPI.getSystemStats();
            setStats(statsRes.data.data);
        } catch (error) {
            addToast(`Failed to create ${userModalType}. ${error.response?.data?.message || ''}`, 'error');
        } finally { setActionLoading(false); }
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    if (loading) return (
        <div className="admin-loading">
            <div className="admin-spinner" />
            <p>Loading Dashboard…</p>
        </div>
    );

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const periods = [1, 2, 3, 4, 5, 6];

    return (
        <div className="admin-layout">

            {/* ── Mobile topbar (logo + hamburger) — only visible on mobile ── */}
            <div className="mobile-topbar">
                <div className="mobile-topbar-brand">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" fill="url(#mtbg)" />
                        <defs><linearGradient id="mtbg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0EA5E9" /><stop offset="100%" stopColor="#10B981" /></linearGradient></defs>
                    </svg>
                    <span className="mobile-topbar-title">Admin Portal</span>
                </div>
                <button className="mobile-toggle-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Overlay */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                        <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" fill="url(#adg)" />
                        <defs><linearGradient id="adg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0EA5E9" /><stop offset="100%" stopColor="#10B981" /></linearGradient></defs>
                    </svg>
                    <h2>Admin Portal</h2>
                    <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>×</button>
                </div>

                <nav className="nav-links">
                    {[
                        { id: 'overview', label: 'Overview', icon: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></> },
                        { id: 'timetable', label: 'Timetable', icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></> },
                        { id: 'students', label: 'Students', icon: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></> },
                        { id: 'faculty', label: 'Faculty', icon: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></> },
                        { id: 'subjects', label: 'Subjects', icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></> },
                    ].map(({ id, label, icon }) => (
                        <button key={id} className={`nav-item ${activeTab === id ? 'active' : ''}`}
                            onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
                            <span>{label}</span>
                        </button>
                    ))}
                </nav>

                <button onClick={() => { logout(); navigate('/login'); }} className="nav-item logout-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    <span>Logout</span>
                </button>
            </aside>

            {/* Main */}
            <main className="main-content">
                <header className="page-header">
                    <div className="page-title">
                        <h1>
                            {activeTab === 'overview' && 'Dashboard Overview'}
                            {activeTab === 'timetable' && 'Master Timetable'}
                            {activeTab === 'students' && 'Student Directory'}
                            {activeTab === 'faculty' && 'Faculty Directory'}
                            {activeTab === 'subjects' && 'Course Catalog'}
                        </h1>
                        <p>SK University · Computer Science Department</p>
                    </div>
                    <div className="user-profile">
                        <div className="user-avatar">{user?.name?.[0] || 'A'}</div>
                        <div className="user-info">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-role">Administrator</span>
                        </div>
                    </div>
                </header>

                {/* ── OVERVIEW ── */}
                {activeTab === 'overview' && (
                    <div className="overview-tab fade-in">
                        <div className="stats-grid">
                            <div className="stat-box stat-blue">
                                <div className="stat-icon">👨‍🎓</div>
                                <div>
                                    <span className="stat-label">Total Students</span>
                                    <span className="stat-value">{stats?.totalStudents || 0}</span>
                                </div>
                            </div>
                            <div className="stat-box stat-green">
                                <div className="stat-icon">👩‍🏫</div>
                                <div>
                                    <span className="stat-label">Total Faculty</span>
                                    <span className="stat-value">{stats?.totalFaculty || 0}</span>
                                </div>
                            </div>
                            <div className="stat-box stat-purple">
                                <div className="stat-icon">📚</div>
                                <div>
                                    <span className="stat-label">Active Subjects</span>
                                    <span className="stat-value">{stats?.totalSubjects || 0}</span>
                                </div>
                            </div>
                        </div>

                        <h3 className="section-title">Quick Actions</h3>
                        <div className="quick-actions-grid">
                            {[
                                { label: 'Add Faculty', desc: 'Register new teaching staff', icon: '👩‍🏫', action: () => { setActiveTab('faculty'); setTimeout(() => openCreateModal('faculty'), 100); } },
                                { label: 'Add Student', desc: 'Enroll new students with roll numbers', icon: '👨‍🎓', action: () => { setActiveTab('students'); setTimeout(() => openCreateModal('student'), 100); } },
                                { label: 'Update Timetable', desc: 'Manage class schedules and periods', icon: '📅', action: () => setActiveTab('timetable') },
                                { label: 'New Semester Reset', desc: 'Reset all attendance for new semester', icon: '🔄', action: handleResetAttendance, danger: true },
                            ].map(({ label, desc, icon, action, danger }) => (
                                <div key={label} className={`action-card ${danger ? 'action-danger' : ''}`} onClick={action}>
                                    <div className="action-icon-wrapper"><span style={{ fontSize: '28px' }}>{icon}</span></div>
                                    <div className="action-title">{label}</div>
                                    <div className="action-desc">{desc}</div>
                                    <div className="action-arrow">→</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── TIMETABLE ── */}
                {activeTab === 'timetable' && (
                    <div className="timetable-tab fade-in">
                        <div className="timetable-hint">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                            Click any cell to edit the subject/faculty for that slot. Changes auto-update the faculty subject-selection dropdown.
                        </div>
                        <div className="timetable-scroll-wrapper">
                            <table className="timetable-grid">
                                <thead>
                                    <tr>
                                        <th>Day</th>
                                        {periods.map(p => <th key={p}>P{p}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {days.map(day => (
                                        <tr key={day}>
                                            <td className="day-label">{day.slice(0, 3)}</td>
                                            {periods.map(period => {
                                                const slot = timetable?.slots?.find(s => s.day === day && s.period === period);
                                                return (
                                                    <td key={period} className={`tt-cell ${slot ? 'tt-filled' : 'tt-empty'}`}
                                                        onClick={() => handleSlotClick(day, period)}>
                                                        {slot ? (
                                                            <>
                                                                <div className="slot-subject">{slot.subject?.code || slot.subject?.name}</div>
                                                                <div className="slot-faculty">{slot.faculty?.name?.split(' ')[0]}</div>
                                                            </>
                                                        ) : (
                                                            <span className="empty-slot">+</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── STUDENTS ── */}
                {activeTab === 'students' && (
                    <div className="students-tab fade-in">
                        <div className="tab-toolbar">
                            <span className="tab-count">{students.length} students</span>
                            <button className="btn btn-primary" onClick={() => openCreateModal('student')}>+ Add Student</button>
                        </div>
                        <div className="glass-card table-wrap">
                            <table className="data-table">
                                <thead><tr><th>Name</th><th>Roll No.</th><th>Branch</th><th>Attendance</th><th>Email</th></tr></thead>
                                <tbody>
                                    {students.map(s => (
                                        <tr key={s._id}>
                                            <td>
                                                <div className="user-badge">
                                                    <div className="avatar-circle student-av">{s.name?.[0] || '?'}</div>
                                                    <span className="user-name-text">{s.name}</span>
                                                </div>
                                            </td>
                                            <td><span className="roll-badge">{s.rollNumber}</span></td>
                                            <td><span className="branch-tag">{s.branch}</span></td>
                                            <td>
                                                <span className={`pct-chip ${(s.attendance?.percentage || 0) < 75 ? 'low' : 'good'}`}>
                                                    {s.attendance?.percentage || 0}%
                                                </span>
                                            </td>
                                            <td className="email-cell">{s.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── FACULTY ── */}
                {activeTab === 'faculty' && (
                    <div className="faculty-tab fade-in">
                        <div className="tab-toolbar">
                            <span className="tab-count">{faculty.length} faculty members</span>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button className="btn btn-danger" onClick={handleResetAttendance}>🔄 New Semester Reset</button>
                            </div>
                        </div>
                        <div className="glass-card table-wrap">
                            <table className="data-table">
                                <thead><tr><th>Name</th><th>Employee ID</th><th>Subject</th><th>Email</th><th>Action</th></tr></thead>
                                <tbody>
                                    {faculty.map(f => (
                                        <tr key={f._id}>
                                            <td>
                                                <div className="user-badge">
                                                    <div className="avatar-circle faculty-av">{f.name?.[0] || '?'}</div>
                                                    <span className="user-name-text">{f.name}</span>
                                                </div>
                                            </td>
                                            <td><span className="emp-badge">{f.employeeId || '—'}</span></td>
                                            <td>
                                                {f.subjects?.length
                                                    ? f.subjects.map(s => <span key={s._id || s} className="subj-pill">{s.code || s}</span>)
                                                    : <span className="no-subj">No subject</span>}
                                            </td>
                                            <td className="email-cell">{f.email}</td>
                                            <td>
                                                <button className="btn-remove-faculty" onClick={() => handleRemoveFaculty(f)}
                                                    title="Remove faculty (frees their subject for new semester registration)">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {faculty.length === 0 && (
                                <div className="empty-state">No faculty registered yet. Faculty can self-register at <strong>/faculty/register</strong>.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── SUBJECTS ── */}
                {activeTab === 'subjects' && (
                    <div className="subjects-tab fade-in">
                        <div className="tab-toolbar">
                            <span className="tab-count">{subjects.length} subjects</span>
                            <button className="btn btn-primary" onClick={() => openCreateModal('subject')}>+ Add Subject</button>
                        </div>
                        <div className="glass-card table-wrap">
                            <table className="data-table">
                                <thead><tr><th>Code</th><th>Name</th><th>Credits</th><th>Sem</th><th>Faculty</th></tr></thead>
                                <tbody>
                                    {subjects.map(s => (
                                        <tr key={s._id}>
                                            <td><span className="code-chip">{s.code}</span></td>
                                            <td className="subj-name-cell">{s.name}</td>
                                            <td>{s.credits}</td>
                                            <td>Sem {s.semester}</td>
                                            <td>
                                                {s.faculty
                                                    ? <span className="faculty-chip">{s.faculty.name || s.faculty}</span>
                                                    : <span className="no-faculty-chip">Unassigned</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* ── TIMETABLE MODAL ── */}
            {showTimetableModal && (
                <div className="modal-overlay" onClick={() => setShowTimetableModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Slot · {selectedSlot.day} · Period {selectedSlot.period}</h3>
                            <button className="modal-close-x" onClick={() => setShowTimetableModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <div className="form-group-row">
                                    <label>Subject</label>
                                    <label className="toggle-label">
                                        <input type="checkbox" checked={selectedSlot.isNewSubject || false}
                                            onChange={e => setSelectedSlot({ ...selectedSlot, isNewSubject: e.target.checked })} />
                                        <span>New subject</span>
                                    </label>
                                </div>
                                {!selectedSlot.isNewSubject ? (
                                    <select className="form-control" value={selectedSlot.subjectId}
                                        onChange={e => setSelectedSlot({ ...selectedSlot, subjectId: e.target.value })}>
                                        <option value="">-- Free Period --</option>
                                        {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                                    </select>
                                ) : (
                                    <div className="form-row">
                                        <input className="form-control" placeholder="Subject Name"
                                            value={selectedSlot.newSubjectName || ''}
                                            onChange={e => setSelectedSlot({ ...selectedSlot, newSubjectName: e.target.value })} />
                                        <input className="form-control" placeholder="Code" style={{ maxWidth: '120px' }}
                                            value={selectedSlot.newSubjectCode || ''}
                                            onChange={e => setSelectedSlot({ ...selectedSlot, newSubjectCode: e.target.value })} />
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <div className="form-group-row">
                                    <label>Faculty</label>
                                    <label className="toggle-label">
                                        <input type="checkbox" checked={selectedSlot.isNewFaculty || false}
                                            onChange={e => setSelectedSlot({ ...selectedSlot, isNewFaculty: e.target.checked })} />
                                        <span>New faculty</span>
                                    </label>
                                </div>
                                {!selectedSlot.isNewFaculty ? (
                                    <select className="form-control" value={selectedSlot.facultyId}
                                        onChange={e => setSelectedSlot({ ...selectedSlot, facultyId: e.target.value })}>
                                        <option value="">-- No Faculty --</option>
                                        {faculty.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                                    </select>
                                ) : (
                                    <div className="form-row">
                                        <input className="form-control" placeholder="Faculty Name"
                                            value={selectedSlot.newFacultyName || ''}
                                            onChange={e => setSelectedSlot({ ...selectedSlot, newFacultyName: e.target.value })} />
                                        <input className="form-control" placeholder="ID (FAC01)" style={{ maxWidth: '120px' }}
                                            value={selectedSlot.newFacultyId || ''}
                                            onChange={e => setSelectedSlot({ ...selectedSlot, newFacultyId: e.target.value })} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowTimetableModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveTimetableSlot} disabled={actionLoading}>
                                {actionLoading ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── CREATE MODAL ── */}
            {showUserModal && (
                <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New {userModalType.charAt(0).toUpperCase() + userModalType.slice(1)}</h3>
                            <button className="modal-close-x" onClick={() => setShowUserModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateSubmit}>
                            <div className="modal-body">
                                {userModalType === 'student' && (<>
                                    <div className="form-group"><label>Full Name</label><input name="name" className="form-control" required onChange={handleInputChange} /></div>
                                    <div className="form-group"><label>Email</label><input name="email" type="email" className="form-control" required onChange={handleInputChange} /></div>
                                    <div className="form-group"><label>Roll Number</label><input name="rollNumber" className="form-control" required onChange={handleInputChange} /></div>
                                    <div className="form-group"><label>Password</label><input name="password" type="password" className="form-control" required onChange={handleInputChange} /></div>
                                    <div className="form-row">
                                        <div className="form-group" style={{ flex: 1 }}><label>Branch</label>
                                            <select name="branch" className="form-control" onChange={handleInputChange}><option value="CSE">CSE</option></select>
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}><label>Semester</label><input name="semester" type="number" className="form-control" required onChange={handleInputChange} /></div>
                                    </div>
                                </>)}
                                {userModalType === 'faculty' && (<>
                                    <div className="form-group"><label>Full Name</label><input name="name" className="form-control" required onChange={handleInputChange} /></div>
                                    <div className="form-group"><label>Email</label><input name="email" type="email" className="form-control" required onChange={handleInputChange} /></div>
                                    <div className="form-group"><label>Employee ID</label><input name="employeeId" className="form-control" required onChange={handleInputChange} /></div>
                                    <div className="form-group"><label>Password</label><input name="password" type="password" className="form-control" required onChange={handleInputChange} /></div>
                                </>)}
                                {userModalType === 'subject' && (<>
                                    <div className="form-group"><label>Subject Name</label><input name="name" className="form-control" required onChange={handleInputChange} /></div>
                                    <div className="form-row">
                                        <div className="form-group" style={{ flex: 1 }}><label>Subject Code</label><input name="code" className="form-control" required onChange={handleInputChange} /></div>
                                        <div className="form-group" style={{ flex: 1 }}><label>Credits</label><input name="credits" type="number" className="form-control" required onChange={handleInputChange} /></div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group" style={{ flex: 1 }}><label>Branch</label>
                                            <select name="branch" className="form-control" onChange={handleInputChange}><option value="CSE">CSE</option></select>
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}><label>Semester</label><input name="semester" type="number" className="form-control" required onChange={handleInputChange} /></div>
                                    </div>
                                </>)}
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={actionLoading}>{actionLoading ? 'Creating…' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── CONFIRM DIALOG ── */}
            {confirmDialog && (
                <div className="modal-overlay">
                    <div className="modal-content confirm-dialog">
                        <div className="modal-header">
                            <h3>{confirmDialog.title}</h3>
                        </div>
                        <div className="modal-body">
                            <p className="confirm-msg">{confirmDialog.message}</p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setConfirmDialog(null)}>Cancel</button>
                            <button className={`btn ${confirmDialog.danger ? 'btn-danger' : 'btn-primary'}`}
                                onClick={confirmDialog.onConfirm}>
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toasts */}
            <div className="toast-container">
                {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />)}
            </div>
        </div>
    );
};

export default AdminDashboard;
