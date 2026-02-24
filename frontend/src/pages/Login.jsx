import { useState, useEffect, useRef } from 'react';
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

    /* OTP Step (Faculty & Admin) */
    const [otpStep, setOtpStep] = useState(false);      // true = show OTP screen
    const [otpEmail, setOtpEmail] = useState('');        // email OTP was sent to
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpErr, setOtpErr] = useState('');
    const [otpLoad, setOtpLoad] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [otpSuccess, setOtpSuccess] = useState('');

    const otpRef0 = useRef();
    const otpRef1 = useRef();
    const otpRef2 = useRef();
    const otpRef3 = useRef();
    const otpRef4 = useRef();
    const otpRef5 = useRef();
    const otpRefs = [otpRef0, otpRef1, otpRef2, otpRef3, otpRef4, otpRef5];

    // Countdown timer for resend
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Auto-focus first OTP box when OTP step starts
    useEffect(() => {
        if (otpStep && otpRefs[0].current) {
            setTimeout(() => otpRefs[0].current?.focus(), 100);
        }
    }, [otpStep]);

    const handleRoleChange = (r) => {
        setRole(r);
        setLoginErr('');
        setEmail('');
        setPassword('');
        setOtpStep(false);
        setOtp(['', '', '', '', '', '']);
        setOtpErr('');
        setOtpSuccess('');
    };

    /* ─── STEP 1: Submit credentials ─── */
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginErr('');
        setLoginLoad(true);
        try {
            const res = await authAPI.login(email.trim(), password, role);
            const data = res.data;

            if (data.requiresOTP) {
                // Faculty / Admin: go to OTP step
                setOtpEmail(data.email);
                setOtpStep(true);
                setResendCooldown(60); // 60 second cooldown before resend
                setOtp(['', '', '', '', '', '']);
            } else {
                // Student: direct login
                const { accessToken, refreshToken, user } = data;
                login(accessToken, refreshToken);
                navigate('/student/dashboard');
            }
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

    /* ─── OTP Input Handler ─── */
    const handleOtpChange = (index, value) => {
        // Only allow digits
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // only one digit
        setOtp(newOtp);
        setOtpErr('');

        // Auto-advance to next box
        if (value && index < 5) {
            otpRefs[index + 1].current?.focus();
        }

        // Auto-submit when all 6 digits are filled
        if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
            handleVerifyOTP(newOtp.join(''));
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (otp[index] === '' && index > 0) {
                otpRefs[index - 1].current?.focus();
            }
            const newOtp = [...otp];
            newOtp[index] = '';
            setOtp(newOtp);
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            otpRefs[index - 1].current?.focus();
        }
        if (e.key === 'ArrowRight' && index < 5) {
            otpRefs[index + 1].current?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const newOtp = pasted.split('');
            setOtp(newOtp);
            otpRefs[5].current?.focus();
            handleVerifyOTP(pasted);
        }
    };

    /* ─── STEP 2: Verify OTP ─── */
    const handleVerifyOTP = async (otpValue) => {
        const code = otpValue || otp.join('');
        if (code.length < 6) {
            setOtpErr('Please enter all 6 digits.');
            return;
        }

        setOtpErr('');
        setOtpLoad(true);
        try {
            const res = await authAPI.verifyLoginOTP(otpEmail, code);
            const { accessToken, refreshToken, user } = res.data;
            login(accessToken, refreshToken);

            if (user.role === 'faculty') navigate('/faculty/dashboard');
            else if (user.role === 'admin') navigate('/admin/dashboard');
            else navigate('/');
        } catch (err) {
            setOtp(['', '', '', '', '', '']);
            otpRefs[0].current?.focus();
            if (err.response) {
                setOtpErr(err.response.data.message || 'Invalid verification code. Please try again.');
            } else {
                setOtpErr('Cannot reach server. Please try again.');
            }
        } finally {
            setOtpLoad(false);
        }
    };

    /* ─── Resend OTP ─── */
    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;
        setOtpErr('');
        setOtpSuccess('');
        try {
            await authAPI.resendLoginOTP(otpEmail, role);
            setOtp(['', '', '', '', '', '']);
            otpRefs[0].current?.focus();
            setResendCooldown(60);
            setOtpSuccess('A new verification code has been sent to your email.');
        } catch (err) {
            setOtpErr('Failed to resend code. Please try again.');
        }
    };

    const handleBackFromOTP = () => {
        setOtpStep(false);
        setOtp(['', '', '', '', '', '']);
        setOtpErr('');
        setOtpSuccess('');
        setOtpEmail('');
    };

    /* ─── RENDER ─── */
    return (
        <div className="lp-wrap">
            <div className="lp-card">

                {/* Back */}
                {!otpStep ? (
                    <button className="lp-back" onClick={() => navigate('/')}>← Back</button>
                ) : (
                    <button className="lp-back" onClick={handleBackFromOTP}>← Back to Login</button>
                )}

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

                {/* ── STEP 1: Credentials ── */}
                {!otpStep && (
                    <>
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

                        {/* Role-specific info badge */}
                        {(role === 'faculty' || role === 'admin') && (
                            <div className="lp-secure-badge">
                                <span className="lp-secure-icon">🔐</span>
                                <span>
                                    {role === 'admin'
                                        ? 'Admin portal requires email OTP verification after login'
                                        : 'Faculty portal requires email OTP verification after login'}
                                </span>
                            </div>
                        )}

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
                                    <button type="button" className="lp-eye" onClick={() => setShowPw(v => !v)}>
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
                                {loginLoad
                                    ? (role === 'student' ? 'Signing in…' : 'Verifying credentials…')
                                    : (role === 'student' ? 'Sign In →' : 'Continue →')}
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
                    </>
                )}

                {/* ── STEP 2: OTP Verification ── */}
                {otpStep && (
                    <div className="lp-otp-section">
                        <div className={`lp-otp-badge ${role}`}>
                            <span className="lp-otp-badge-icon">
                                {role === 'admin' ? '🛡️' : '🔑'}
                            </span>
                            <span>{role === 'admin' ? 'Admin' : 'Faculty'} Verification</span>
                        </div>

                        <h2 className="lp-form-title" style={{ marginTop: '16px' }}>
                            Check Your Email
                        </h2>

                        <p className="lp-otp-desc">
                            We sent a 6-digit verification code to:
                        </p>
                        <div className="lp-otp-email-display">
                            <span className="lp-otp-email-icon">📧</span>
                            <strong>{otpEmail}</strong>
                        </div>

                        <p className="lp-otp-hint">Enter the code below to complete sign in</p>

                        {/* 6-digit OTP boxes */}
                        <div className="lp-otp-boxes" onPaste={handleOtpPaste}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={otpRefs[index]}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    className={`lp-otp-box ${digit ? 'filled' : ''} ${otpErr ? 'error' : ''} ${role}`}
                                    value={digit}
                                    onChange={e => handleOtpChange(index, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(index, e)}
                                    disabled={otpLoad}
                                    autoComplete="off"
                                />
                            ))}
                        </div>

                        {/* Errors & Success */}
                        {otpErr && <div className="lp-err" style={{ textAlign: 'center', marginTop: '12px' }}>{otpErr}</div>}
                        {otpSuccess && <div className="lp-success" style={{ textAlign: 'center', marginTop: '12px' }}>{otpSuccess}</div>}

                        {/* Verify Button */}
                        <button
                            className={`lp-submit lp-otp-verify-btn ${role}`}
                            onClick={() => handleVerifyOTP()}
                            disabled={otpLoad || otp.join('').length < 6}
                            style={{ marginTop: '20px' }}
                        >
                            {otpLoad ? 'Verifying…' : `Verify & Sign In →`}
                        </button>

                        {/* Resend */}
                        <div className="lp-otp-resend">
                            <span>Didn't receive the code?</span>
                            {resendCooldown > 0 ? (
                                <span className="lp-otp-cooldown">
                                    Resend in {resendCooldown}s
                                </span>
                            ) : (
                                <button
                                    className="lp-register-link"
                                    onClick={handleResendOTP}
                                    type="button"
                                >
                                    Resend Code
                                </button>
                            )}
                        </div>

                        <div className="lp-otp-security-note">
                            🔒 This extra step protects your {role === 'admin' ? 'admin' : 'faculty'} account from unauthorized access
                        </div>
                    </div>
                )}

                <div className="lp-footer">© 2026 SKUCET · Computer Science Department</div>
            </div>
        </div>
    );
}
