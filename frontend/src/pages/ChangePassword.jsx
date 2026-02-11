import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './ChangePassword.css';

const ChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user, updateUserFirstLogin } = useAuth();

    const validatePassword = (password) => {
        if (password.length < 8) {
            return 'Password must be at least 8 characters long';
        }
        if (!/(?=.*[a-z])/.test(password)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/(?=.*\d)/.test(password)) {
            return 'Password must contain at least one number';
        }
        if (!/(?=.*[@$!%*?&])/.test(password)) {
            return 'Password must contain at least one special character (@$!%*?&)';
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        const validationError = validatePassword(newPassword);
        if (validationError) {
            setError(validationError);
            return;
        }

        if (currentPassword === newPassword) {
            setError('New password must be different from current password');
            return;
        }

        setLoading(true);

        try {
            await authAPI.changePassword(currentPassword, newPassword);
            setSuccess('Password changed successfully! Redirecting...');
            updateUserFirstLogin();

            setTimeout(() => {
                switch (user?.role) {
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
            }, 2000);
        } catch (err) {
            console.error('Change password error:', err);
            if (err.response) {
                setError(err.response.data.message || 'Failed to change password');
            } else {
                setError('An error occurred. Please try again.');
            }
            setLoading(false);
        }
    };

    const requirements = [
        { text: 'At least 8 characters', test: (p) => p.length >= 8 },
        { text: 'One lowercase letter', test: (p) => /(?=.*[a-z])/.test(p) },
        { text: 'One uppercase letter', test: (p) => /(?=.*[A-Z])/.test(p) },
        { text: 'One number', test: (p) => /(?=.*\d)/.test(p) },
        { text: 'One special character (@$!%*?&)', test: (p) => /(?=.*[@$!%*?&])/.test(p) },
    ];

    return (
        <div className="change-password-page">
            <div className="change-password-background">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
            </div>

            <div className="change-password-container">
                <div className="change-password-card glass-card">
                    <div className="change-password-header">
                        <div className="security-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z" fill="currentColor" />
                            </svg>
                        </div>
                        <h1>Change Password</h1>
                        <p className="subtitle">
                            {user?.isFirstLogin
                                ? 'Please set a new secure password for your account'
                                : 'Update your password'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="change-password-form">
                        <div className="input-group">
                            <label htmlFor="currentPassword" className="input-label">
                                Current Password
                            </label>
                            <input
                                id="currentPassword"
                                type="password"
                                className="input-field"
                                placeholder="Enter current password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="newPassword" className="input-label">
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                className="input-field"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="confirmPassword" className="input-label">
                                Confirm New Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className="input-field"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        {/* Password Requirements */}
                        <div className="password-requirements">
                            <p className="requirements-title">Password Requirements:</p>
                            <ul className="requirements-list">
                                {requirements.map((req, index) => (
                                    <li
                                        key={index}
                                        className={newPassword && req.test(newPassword) ? 'requirement-met' : ''}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor" />
                                        </svg>
                                        <span>{req.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {error && (
                            <div className="error-alert">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="success-alert">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" />
                                </svg>
                                <span>{success}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-change-password"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner-small"></div>
                                    Updating Password...
                                </>
                            ) : (
                                <>
                                    <span>Update Password</span>
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
