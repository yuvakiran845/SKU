
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
    const [logs, setLogs] = useState([]);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, timetable, students, faculty, subjects
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // Modals
    const [showTimetableModal, setShowTimetableModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null); // { day, period, subjectId, facultyId }

    const [showUserModal, setShowUserModal] = useState(false);
    const [userModalType, setUserModalType] = useState('student'); // 'student' | 'faculty' | 'subject'
    const [formData, setFormData] = useState({}); // Generic form holder
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [statsRes, studentsRes, facultyRes, subjectsRes, timetableRes] = await Promise.all([
                adminAPI.getSystemStats(),
                adminAPI.getAllStudents({ limit: 1000 }),
                adminAPI.getAllFaculty({ limit: 100 }), // Need all for dropdowns
                adminAPI.getAllSubjects(), // Need all for dropdowns
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
        // Find existing slot data
        const existing = timetable?.slots?.find(s => s.day === day && s.period === period);
        setSelectedSlot({
            day,
            period,
            subjectId: existing?.subject?._id || '',
            facultyId: existing?.faculty?._id || ''
        });
        setShowTimetableModal(true);
    };

    const saveTimetableSlot = async () => {
        try {
            let finalSubjectId = selectedSlot.subjectId;
            let finalFacultyId = selectedSlot.facultyId;

            // Handle New Subject Creation
            if (selectedSlot.isNewSubject) {
                if (!selectedSlot.newSubjectName || !selectedSlot.newSubjectCode) {
                    addToast('Please enter Subject Name and Code', 'error');
                    return;
                }
                const subRes = await adminAPI.createSubject({
                    name: selectedSlot.newSubjectName,
                    code: selectedSlot.newSubjectCode,
                    credits: 3, // Default
                    semester: 1, // Default
                    branch: 'CSE' // Default
                });
                finalSubjectId = subRes.data.data._id;
            }

            // Handle New Faculty Creation
            if (selectedSlot.isNewFaculty) {
                if (!selectedSlot.newFacultyName || !selectedSlot.newFacultyId) {
                    addToast('Please enter Faculty Name and ID', 'error');
                    return;
                }
                const facRes = await adminAPI.createFaculty({
                    name: selectedSlot.newFacultyName,
                    employeeId: selectedSlot.newFacultyId,
                    email: `${selectedSlot.newFacultyId.toLowerCase()}@sku.edu`, // Auto-generate
                    password: 'password123' // Default
                });
                finalFacultyId = facRes.data.data._id;
            }

            const payload = {
                timetableId: timetable._id,
                day: selectedSlot.day,
                period: selectedSlot.period,
                subjectId: finalSubjectId,
                facultyId: finalFacultyId
            };

            const res = await adminAPI.updateTimetableSlot(payload);
            setTimetable(res.data.data); // Use updated timetable from response directly

            // Refresh dropdown lists if new items were added
            if (selectedSlot.isNewSubject) {
                const s = await adminAPI.getAllSubjects();
                setSubjects(s.data.data || []);
            }
            if (selectedSlot.isNewFaculty) {
                const f = await adminAPI.getAllFaculty({ limit: 100 });
                setFaculty(f.data.data?.faculty || []);
            }

            setShowTimetableModal(false);
            addToast('Timetable updated successfully!', 'success');
        } catch (error) {
            console.error(error);
            addToast('Failed to update timetable', 'error');
        }
    };

    // -- User/Entity Management Logic --
    const openCreateModal = (type) => {
        setUserModalType(type);
        setFormData({}); // specific fields init needed? 
        setShowUserModal(true);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            if (userModalType === 'student') {
                await adminAPI.createStudent(formData);
                // Refresh students
                const res = await adminAPI.getAllStudents({ limit: 10 });
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
            addToast(`${userModalType} created successfully!`, 'success');
        } catch (error) {
            console.error(error);
            addToast(`Failed to create ${userModalType}. Check console.`, 'error');
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // -- Renderers --
    if (loading) return <div className="loading-overlay">Loading Dashboard...</div>;

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const periods = [1, 2, 3, 4, 5, 6];

    return (
        <div className="admin-layout">
            {/* Mobile Sidebar Toggle */}
            {!isSidebarOpen && (
                <button className="mobile-toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
            )}

            {/* Overlay for Mobile */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <img src="/skucet-logo.svg" alt="Logo" width="32" />
                    <h2>Admin Portal</h2>
                    {/* Close button for mobile */}
                    <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>×</button>
                </div>

                <nav className="nav-links">
                    <button
                        className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
                        title="Overview"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        <span>Overview</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'timetable' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('timetable'); setIsSidebarOpen(false); }}
                        title="Timetable Management"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>Timetable</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); }}
                        title="Students"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 010 7.75"></path>
                        </svg>
                        <span>Students</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'faculty' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('faculty'); setIsSidebarOpen(false); }}
                        title="Faculty"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>Faculty</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'subjects' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('subjects'); setIsSidebarOpen(false); }}
                        title="Subjects"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                        <span>Subjects</span>
                    </button>
                </nav>

                <button onClick={() => { logout(); navigate('/login'); }} className="nav-item logout-btn">
                    Logout
                </button>
            </aside>

            {/* Main Content */}
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
                        <p>Manage your institution's digital infrastructure</p>
                    </div>
                    <div className="user-profile">
                        <span style={{ fontWeight: '600' }}>{user?.name} (Admin)</span>
                    </div>
                </header>

                {activeTab === 'overview' && (
                    <div className="overview-tab fade-in">
                        <div className="stats-grid">
                            <div className="stat-box">
                                <span className="stat-label">Total Students</span>
                                <span className="stat-value">{stats?.totalStudents || 0}</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-label">Total Faculty</span>
                                <span className="stat-value">{stats?.totalFaculty || 0}</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-label">Active Subjects</span>
                                <span className="stat-value">{stats?.totalSubjects || 0}</span>
                            </div>
                        </div>

                        <h3 className="section-title" style={{ marginTop: '3rem', marginBottom: '1rem', color: 'var(--stripe-text)' }}>Quick Actions</h3>
                        <div className="quick-actions-grid">
                            <div className="action-card" onClick={() => { setActiveTab('faculty'); setTimeout(() => openCreateModal('faculty'), 100); }}>
                                <div className="action-icon-wrapper">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="8.5" cy="7" r="4"></circle>
                                        <line x1="20" y1="8" x2="20" y2="14"></line>
                                        <line x1="23" y1="11" x2="17" y2="11"></line>
                                    </svg>
                                </div>
                                <div className="action-title">Add Faculty</div>
                                <div className="action-desc">Register new teaching staff to the system</div>
                                <div className="action-arrow">→</div>
                            </div>

                            <div className="action-card" onClick={() => { setActiveTab('students'); setTimeout(() => openCreateModal('student'), 100); }}>
                                <div className="action-icon-wrapper">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="8.5" cy="7" r="4"></circle>
                                        <line x1="20" y1="8" x2="20" y2="14"></line>
                                        <line x1="23" y1="11" x2="17" y2="11"></line>
                                    </svg>
                                </div>
                                <div className="action-title">Add Student</div>
                                <div className="action-desc">Enroll new students with roll numbers</div>
                                <div className="action-arrow">→</div>
                            </div>

                            <div className="action-card" onClick={() => setActiveTab('timetable')}>
                                <div className="action-icon-wrapper">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                </div>
                                <div className="action-title">Update Timetable</div>
                                <div className="action-desc">Manage class schedules and periods</div>
                                <div className="action-arrow">→</div>
                            </div>
                        </div>
                    </div>
                )
                }

                {
                    activeTab === 'timetable' && (
                        <div className="timetable-tab fade-in">
                            <div className="timetable-editor">
                                <table className="timetable-grid">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '100px' }}>Day / Period</th>
                                            {periods.map(p => <th key={p}>Period {p}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {days.map(day => (
                                            <tr key={day}>
                                                <td style={{ padding: '1rem', fontWeight: 'bold', borderRight: '1px solid #e3e8ee' }}>{day}</td>
                                                {periods.map(period => {
                                                    const slot = timetable?.slots?.find(s => s.day === day && s.period === period);
                                                    return (
                                                        <td key={period} onClick={() => handleSlotClick(day, period)}>
                                                            {slot ? (
                                                                <div className="timetable-cell active-slot">
                                                                    <div className="slot-subject">{slot.subject?.name}</div>
                                                                    <div className="slot-faculty">{slot.faculty?.name}</div>
                                                                </div>
                                                            ) : (
                                                                <div className="timetable-cell">
                                                                    <span className="empty-slot">+ Add</span>
                                                                </div>
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
                    )
                }

                {
                    activeTab === 'students' && (
                        <div className="students-tab fade-in">
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                <button className="btn btn-primary" onClick={() => openCreateModal('student')}>+ Add Student</button>
                            </div>
                            <div className="glass-card">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Roll Number</th>
                                            <th>Branch</th>
                                            <th>Attendance</th>
                                            <th>Email</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(s => (
                                            <tr key={s._id}>
                                                <td>
                                                    <div className="user-badge">
                                                        <div className="avatar-circle">{s.name[0]}</div>
                                                        <span style={{ fontWeight: '600' }}>{s.name}</span>
                                                    </div>
                                                </td>
                                                <td>{s.rollNumber}</td>
                                                <td><span style={{ background: '#e3e8ee', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{s.branch}</span></td>
                                                <td>
                                                    <span style={{
                                                        fontWeight: 'bold',
                                                        color: (s.attendance?.percentage || 0) < 75 ? '#ef4444' : '#10b981'
                                                    }}>
                                                        {s.attendance?.percentage || 0}%
                                                    </span>
                                                </td>
                                                <td>{s.email}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === 'faculty' && (
                        <div className="faculty-tab fade-in">
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                <button className="btn btn-primary" onClick={() => openCreateModal('faculty')}>+ Add Faculty</button>
                            </div>
                            <div className="glass-card">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>ID</th>
                                            <th>Subjects</th>
                                            <th>Email</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {faculty.map(f => (
                                            <tr key={f._id}>
                                                <td>
                                                    <div className="user-badge">
                                                        <div className="avatar-circle" style={{ background: '#e0f2f1', color: '#00695c' }}>{f.name[0]}</div>
                                                        <span style={{ fontWeight: '600' }}>{f.name}</span>
                                                    </div>
                                                </td>
                                                <td>{f.employeeId}</td>
                                                <td>{f.subjects?.map(s => s.code).join(', ') || '-'}</td>
                                                <td>{f.email}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === 'subjects' && (
                        <div className="subjects-tab fade-in">
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                <button className="btn btn-primary" onClick={() => openCreateModal('subject')}>+ Add Subject</button>
                            </div>
                            <div className="glass-card">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Name</th>
                                            <th>Credits</th>
                                            <th>Dept</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subjects.map(s => (
                                            <tr key={s._id}>
                                                <td style={{ fontWeight: '700', color: 'var(--stripe-accent)' }}>{s.code}</td>
                                                <td style={{ fontWeight: '600' }}>{s.name}</td>
                                                <td>{s.credits}</td>
                                                <td>{s.branch}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }
            </main >

            {/* Timetable Edit Modal */}
            {
                showTimetableModal && (
                    <div className="modal-overlay" onClick={() => setShowTimetableModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Edit Slot: {selectedSlot.day} - Period {selectedSlot.period}</h3>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label>Subject</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                id="newSub"
                                                checked={selectedSlot.isNewSubject || false}
                                                onChange={e => setSelectedSlot({ ...selectedSlot, isNewSubject: e.target.checked })}
                                            />
                                            <label htmlFor="newSub" style={{ fontSize: '0.8rem', margin: 0, fontWeight: 'normal', cursor: 'pointer' }}>New?</label>
                                        </div>
                                    </div>

                                    {!selectedSlot.isNewSubject ? (
                                        <select
                                            className="form-control"
                                            value={selectedSlot.subjectId}
                                            onChange={e => setSelectedSlot({ ...selectedSlot, subjectId: e.target.value })}
                                        >
                                            <option value="">-- Free Period --</option>
                                            {subjects.map(s => (
                                                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                className="form-control"
                                                placeholder="Subject Name"
                                                value={selectedSlot.newSubjectName || ''}
                                                onChange={e => setSelectedSlot({ ...selectedSlot, newSubjectName: e.target.value })}
                                            />
                                            <input
                                                className="form-control"
                                                placeholder="Code (e.g. CS101)"
                                                style={{ width: '120px' }}
                                                value={selectedSlot.newSubjectCode || ''}
                                                onChange={e => setSelectedSlot({ ...selectedSlot, newSubjectCode: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label>Faculty</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                id="newFac"
                                                checked={selectedSlot.isNewFaculty || false}
                                                onChange={e => setSelectedSlot({ ...selectedSlot, isNewFaculty: e.target.checked })}
                                            />
                                            <label htmlFor="newFac" style={{ fontSize: '0.8rem', margin: 0, fontWeight: 'normal', cursor: 'pointer' }}>New?</label>
                                        </div>
                                    </div>

                                    {!selectedSlot.isNewFaculty ? (
                                        <select
                                            className="form-control"
                                            value={selectedSlot.facultyId}
                                            onChange={e => setSelectedSlot({ ...selectedSlot, facultyId: e.target.value })}
                                        >
                                            <option value="">-- No Faculty --</option>
                                            {faculty.map(f => (
                                                <option key={f._id} value={f._id}>{f.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                className="form-control"
                                                placeholder="Faculty Name"
                                                value={selectedSlot.newFacultyName || ''}
                                                onChange={e => setSelectedSlot({ ...selectedSlot, newFacultyName: e.target.value })}
                                            />
                                            <input
                                                className="form-control"
                                                placeholder="ID (e.g. FAC01)"
                                                style={{ width: '120px' }}
                                                value={selectedSlot.newFacultyId || ''}
                                                onChange={e => setSelectedSlot({ ...selectedSlot, newFacultyId: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setShowTimetableModal(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={saveTimetableSlot}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Entity Creation Modal (Generic) */}
            {
                showUserModal && (
                    <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 style={{ textTransform: 'capitalize' }}>Create New {userModalType}</h3>
                            </div>
                            <form onSubmit={handleCreateSubmit}>
                                {userModalType === 'student' && (
                                    <>
                                        <div className="form-group">
                                            <label>Full Name</label>
                                            <input name="name" className="form-control" required onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Email</label>
                                            <input name="email" type="email" className="form-control" required onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Roll Number</label>
                                            <input name="rollNumber" className="form-control" required onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Password</label>
                                            <input name="password" type="password" className="form-control" required onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Branch</label>
                                            <select name="branch" className="form-control" onChange={handleInputChange}>
                                                <option value="CSE">CSE</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Semester</label>
                                            <input name="semester" type="number" className="form-control" required onChange={handleInputChange} />
                                        </div>
                                    </>
                                )}

                                {userModalType === 'faculty' && (
                                    <>
                                        <div className="form-group">
                                            <label>Full Name</label>
                                            <input name="name" className="form-control" required onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Email</label>
                                            <input name="email" type="email" className="form-control" required onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Employee ID</label>
                                            <input name="employeeId" className="form-control" required onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Password</label>
                                            <input name="password" type="password" className="form-control" required onChange={handleInputChange} />
                                        </div>
                                    </>
                                )}

                                {userModalType === 'subject' && (
                                    <>
                                        <div className="form-group">
                                            <label>Subject Name</label>
                                            <input name="name" className="form-control" required onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Subject Code</label>
                                            <input name="code" className="form-control" required onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Credits</label>
                                            <input name="credits" type="number" className="form-control" required onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Branch</label>
                                            <select name="branch" className="form-control" onChange={handleInputChange}>
                                                <option value="CSE">CSE</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Semester</label>
                                            <input name="semester" type="number" className="form-control" required onChange={handleInputChange} />
                                        </div>
                                    </>
                                )}

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Create</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {
                <div className="toast-container">
                    {toasts.map(toast => (
                        <Toast
                            key={toast.id}
                            message={toast.message}
                            type={toast.type}
                            onClose={() => removeToast(toast.id)}
                        />
                    ))}
                </div>
            }
        </div >
    );
};

export default AdminDashboard;
