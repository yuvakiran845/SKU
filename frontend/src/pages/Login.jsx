import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './Login.css';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const state = location.state || {};

    /* Role */
    const [role, setRole] = useState(state.portal || 'student');

    /* Login form */
    const [email, setEmail] = useState(state.email || '');
    const [password, setPassword] = useState(state.password || '');
    const [showPw, setShowPw] = useState(false);
    const [loginErr, setLoginErr] = useState('');
    const [loginLoad, setLoginLoad] = useState(false);

    const handleRoleChange = (r) => {
        setRole(r);
        setLoginErr('');
        setEmail('');
        setPassword('');
    };

    /* ─── Submit credentials → direct login for ALL roles ─── */
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginErr('');
        setLoginLoad(true);
        try {
            const res = await authAPI.login(email.trim(), password, role);
            const data = res.data;

            const { accessToken, refreshToken, user } = data;
            login(accessToken, refreshToken);

            if (role === 'faculty') navigate('/faculty/dashboard');
            else if (role === 'admin') navigate('/admin/dashboard');
            else navigate('/student/dashboard');

        } catch (err) {
            if (err.response) {
                setLoginErr(err.response.data.message || 'Invalid email or password.');
            } else if (err.request) {
                setLoginErr('Cannot reach server. Please try again.');
            } else {
                setLoginErr('An unexpected error occurred.');
            }
        } finally {
            setLoginLoad(false);
        }
    };

    /* ─── RENDER ─── */
    return (
        <div className="lp-wrap">
            <div className="lp-card">

                {/* Back */}
                <button className="lp-back" onClick={() => navigate('/')}>← Back</button>

                {/* Logo */}
                <div className="lp-logo-row">
                    <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
                        <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"
                            fill="url(#lpg)" />
                        <defs><linearGradient id="lpg" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0EA5E9" />
                            <stop offset="100%" stopColor="#10B981" />
                        </linearGradient></defs>
                    </svg>
                    <div>
                        <h1 className="lp-brand">SKUCET</h1>
                        <p className="lp-sub">Attendance Management System</p>
                    </div>
                </div>

                {/* Role tabs */}
                <div className="lp-tabs">
                    {['student', 'faculty', 'admin'].map(r => (
                        <button
                            key={r}
                            className={`lp-tab ${role === r ? 'active' : ''}`}
                            onClick={() => handleRoleChange(r)}
                        >
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Login form title */}
                <h2 className="lp-form-title">
                    {role === 'faculty' ? 'Faculty Sign In'
                        : role === 'admin' ? 'Admin Sign In'
                            : 'Student Sign In'}
                </h2>

                {/* Login form */}
                <form onSubmit={handleLogin} className="lp-form">
                    <div className="lp-field">
                        <label className="lp-label">Email Address</label>
                        <input
                            type="email"
                            className="lp-input"
                            placeholder={
                                role === 'faculty' ? 'Enter your faculty email'
                                    : role === 'admin' ? 'Enter admin email'
                                        : 'Enter your student email'
                            }
                            value={email}
                            onChange={e => { setEmail(e.target.value); setLoginErr(''); }}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="lp-field">
                        <label className="lp-label">Password</label>
                        <div className="lp-pw-wrap">
                            <input
                                type={showPw ? 'text' : 'password'}
                                className="lp-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => { setPassword(e.target.value); setLoginErr(''); }}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="lp-eye"
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => setShowPw(v => !v)}
                            >
                                {showPw
                                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                }
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {loginErr && <div className="lp-err">{loginErr}</div>}

                    <button type="submit" className="lp-submit" disabled={loginLoad}>
                        {loginLoad ? 'Signing in…' : 'Sign In →'}
                    </button>
                </form>

                {/* Faculty-only: small register link below */}
                {role === 'faculty' && (
                    <p className="lp-register-hint">
                        New faculty?{' '}
                        <button
                            className="lp-register-link"
                            onClick={() => navigate('/faculty/register')}
                        >
                            Register here
                        </button>
                    </p>
                )}

                <div className="lp-footer">© 2026 SKUCET · Computer Science Department</div>
            </div>
        </div>
    );
}
