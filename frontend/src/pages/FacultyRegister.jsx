import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './FacultyRegister.css';

export default function FacultyRegister() {
    const navigate = useNavigate();

    /* subjects */
    const [subjects, setSubjects] = useState([]);
    const [subjLoading, setSubjLoading] = useState(true);
    const [subjErr, setSubjErr] = useState('');

    /* form */
    const [subjectId, setSubjectId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [showCpw, setShowCpw] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formErr, setFormErr] = useState('');

    useEffect(() => {
        authAPI.getAvailableSubjects()
            .then(res => setSubjects(res.data.data.available || []))
            .catch(() => setSubjErr('Could not load subjects — make sure backend is running.'))
            .finally(() => setSubjLoading(false));
    }, []);

    const selObj = subjects.find(s => s._id === subjectId);

    const validate = () => {
        if (!subjectId) return 'Please select a subject.';
        if (!email) return 'Please enter your email address.';
        if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email address.';
        if (!password) return 'Please enter a password.';
        if (password.length < 6) return 'Password must be at least 6 characters.';
        if (password !== confirmPw) return 'Passwords do not match.';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (err) { setFormErr(err); return; }

        setSubmitting(true); setFormErr('');
        try {
            await authAPI.registerFaculty(subjectId, email.trim().toLowerCase(), password);
            // Navigate to login with credentials pre-filled
            navigate('/login', {
                state: { portal: 'faculty', email: email.trim().toLowerCase(), password }
            });
        } catch (ex) {
            setFormErr(ex.response?.data?.message || 'Registration failed. Please try again.');
        } finally { setSubmitting(false); }
    };

    return (
        <div className="fr-page">
            <div className="fr-card">

                {/* ── Back Button ── */}
                <button
                    className="fr-back-btn"
                    onClick={() => navigate('/login', { state: { portal: 'faculty' } })}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
                    </svg>
                    Back to Login
                </button>

                {/* ── Header ── */}
                <div className="fr-header">
                    <div className="fr-logo-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"
                                fill="url(#frg)" />
                            <defs>
                                <linearGradient id="frg" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#0EA5E9" />
                                    <stop offset="100%" stopColor="#10B981" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div>
                        <div className="fr-brand">SKUCET</div>
                        <div className="fr-brand-sub">Faculty Registration</div>
                    </div>
                </div>

                {/* ── Form ── */}
                <form onSubmit={handleSubmit} noValidate>

                    {/* Subject */}
                    <div className="fr-field">
                        <label className="fr-label">Subject</label>
                        {subjLoading ? (
                            <div className="fr-skeleton" />
                        ) : subjErr ? (
                            <div className="fr-alert-err">{subjErr}</div>
                        ) : subjects.length === 0 ? (
                            <div className="fr-alert-info">All subjects are already registered. Please sign in.</div>
                        ) : (
                            <select
                                className="fr-input fr-select"
                                value={subjectId}
                                onChange={e => { setSubjectId(e.target.value); setFormErr(''); }}
                            >
                                <option value="">— Select your assigned subject —</option>
                                {subjects.map(s => (
                                    <option key={s._id} value={s._id}>
                                        {s.code} · {s.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        {selObj && (
                            <div className="fr-subject-pill">
                                <span className="fr-subject-code">{selObj.code}</span>
                                <span className="fr-subject-name">{selObj.name}</span>
                                <span className="fr-subject-meta">Semester {selObj.semester} · {selObj.credits} Credits</span>
                            </div>
                        )}
                    </div>

                    {/* Email */}
                    <div className="fr-field">
                        <label className="fr-label">Email Address</label>
                        <input
                            type="email"
                            className="fr-input"
                            placeholder="your@email.com"
                            value={email}
                            onChange={e => { setEmail(e.target.value); setFormErr(''); }}
                        />
                    </div>

                    {/* Password */}
                    <div className="fr-field">
                        <label className="fr-label">Password</label>
                        <div className="fr-pw-wrap">
                            <input
                                type={showPw ? 'text' : 'password'}
                                className="fr-input"
                                placeholder="Min. 6 characters"
                                value={password}
                                onChange={e => { setPassword(e.target.value); setFormErr(''); }}
                            />
                            <button type="button" className="fr-eye" onClick={() => setShowPw(v => !v)}>
                                {showPw
                                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                }
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="fr-field">
                        <label className="fr-label">Confirm Password</label>
                        <div className="fr-pw-wrap">
                            <input
                                type={showCpw ? 'text' : 'password'}
                                className="fr-input"
                                placeholder="Re-enter your password"
                                value={confirmPw}
                                onChange={e => { setConfirmPw(e.target.value); setFormErr(''); }}
                            />
                            <button type="button" className="fr-eye" onClick={() => setShowCpw(v => !v)}>
                                {showCpw
                                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                }
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {formErr && <div className="fr-err">{formErr}</div>}

                    {/* Submit */}
                    <button type="submit" className="fr-submit" disabled={submitting}>
                        {submitting ? 'Registering…' : 'Register →'}
                    </button>

                    {/* Sign-in link */}
                    <p className="fr-signin-row">
                        Already have an account?{' '}
                        <button
                            type="button"
                            className="fr-signin-link"
                            onClick={() => navigate('/login', { state: { portal: 'faculty' } })}
                        >
                            Sign in here
                        </button>
                    </p>
                </form>

                <div className="fr-footer">© 2026 SKUCET · Computer Science Department</div>
            </div>
        </div>
    );
}
