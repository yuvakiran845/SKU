import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Add location hook
    const { login } = useAuth();

    // Default to student or use the passed role from navigation state
    const [selectedRole, setSelectedRole] = useState(location.state?.portal || 'student');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Update role if location state changes (though normally component remounts)
    useEffect(() => {
        if (location.state?.portal) {
            setSelectedRole(location.state.portal);
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(email, password);
            const { accessToken, refreshToken, user } = response.data;

            login(accessToken, refreshToken);

            // Redirect based on role
            switch (user.role) {
                case 'student':
                    navigate('/student/dashboard');
                    break;
                case 'faculty':
                    navigate('/faculty/dashboard');
                    break;
                case 'admin':
                    navigate('/admin/dashboard');
                    break;
                default:
                    navigate('/');
            }
        } catch (err) {
            console.error('Login error:', err);
            if (err.response) {
                setError(err.response.data.message || 'Invalid credentials');
            } else if (err.request) {
                setError('Unable to connect to server. Please try again.');
            } else {
                setError('An error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getRolePlaceholder = () => {
        switch (selectedRole) {
            case 'student':
                return { email: 'student@sku.edu', password: 'Enter your password' };
            case 'faculty':
                return { email: 'faculty@sku.edu', password: 'Enter your password' };
            case 'admin':
                return { email: 'admin@sku.edu', password: 'Enter your password' };
            default:
                return { email: 'Enter your email', password: 'Enter your password' };
        }
    };

    const placeholder = getRolePlaceholder();

    return (
        <div className="login-page-clean">
            <div className="login-container-clean">
                <div className="login-card-clean">
                    {/* Back Button */}
                    <button
                        className="back-btn-clean"
                        onClick={() => navigate('/')}
                    >
                        ← Back to Home
                    </button>

                    {/* Logo Section */}
                    <div className="login-header-clean">
                        <svg className="login-logo-icon" width="56" height="56" viewBox="0 0 24 24" fill="none">
                            <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" fill="url(#login-logo-gradient)" />
                            <defs>
                                <linearGradient id="login-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#0EA5E9" />
                                    <stop offset="100%" stopColor="#10B981" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <h1 className="login-title">SKUCET</h1>
                        <p className="login-subtitle">Attendance Management System</p>
                    </div>

                    {/* Role Selector */}
                    <div className="role-section-clean">
                        <p className="role-label">Select Your Role</p>
                        <div className="role-buttons-clean">
                            <button
                                type="button"
                                className={`role-btn-clean ${selectedRole === 'student' ? 'active' : ''}`}
                                onClick={() => setSelectedRole('student')}
                            >
                                Student
                            </button>
                            <button
                                type="button"
                                className={`role-btn-clean ${selectedRole === 'faculty' ? 'active' : ''}`}
                                onClick={() => setSelectedRole('faculty')}
                            >
                                Faculty
                            </button>
                            <button
                                type="button"
                                className={`role-btn-clean ${selectedRole === 'admin' ? 'active' : ''}`}
                                onClick={() => setSelectedRole('admin')}
                            >
                                Admin
                            </button>
                        </div>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="form-clean">
                        <div className="form-group-clean">
                            <label className="label-clean">Email Address</label>
                            <input
                                type="email"
                                className="input-clean"
                                placeholder={placeholder.email}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="off"
                            />
                        </div>

                        <div className="form-group-clean">
                            <label className="label-clean">Password</label>
                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input-clean"
                                    placeholder={placeholder.password}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    className="password-toggle-clean"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="error-message-clean">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="submit-btn-clean"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In →'}
                        </button>
                    </form>

                    <div className="footer-clean">
                        <p>© 2026 SKUCET - Computer Science Department</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
