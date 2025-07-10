import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ResetPasswordSVG from '../assets/reset-password.svg';
import authService from '../services/authService';
import './ResetPasswordPage.css';

const BilloraLogo = () => (
  <div className="reset-logo" aria-label="Billora logo">
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="40" height="32" rx="8" fill="#5E2CA5"/>
      <rect x="10" y="14" width="28" height="20" rx="4" fill="#F9F1FF"/>
      <circle cx="24" cy="24" r="4" fill="#F72585"/>
    </svg>
  </div>
);

const ResetPasswordPage = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setMessage('');
      return;
    }
    setError('');
    setMessage('');
    try {
      await authService.resetPassword(token, formData.password);
      setMessage('Your password has been reset successfully! You can now log in.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    }
  };

  return (
    <div className="reset-bg-row">
      <div className="reset-illustration-col">
        <img src={ResetPasswordSVG} alt="Reset password illustration" className="reset-illustration" />
      </div>
      <div className="reset-card-col">
        <div className="reset-card">
          <BilloraLogo />
          <h1 className="reset-title">Reset Your Password</h1>
          <p className="reset-instructions">Enter your new password below.</p>
          <form onSubmit={handleSubmit} className="reset-form">
            <div>
              <label className="reset-label">New Password</label>
              <div className="reset-password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="reset-input"
                />
                <button type="button" className="reset-show-btn" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} aria-label="Show/Hide Password">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div>
              <label className="reset-label">Confirm New Password</label>
              <div className="reset-password-input-wrapper">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="reset-input"
                />
                <button type="button" className="reset-show-btn" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1} aria-label="Show/Hide Password">
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button type="submit" className="reset-btn-primary">Reset Password</button>
          </form>
          {message && <div className="reset-success">{message}</div>}
          {error && <div className="reset-error">{error}</div>}
          <div>
            <Link to="/login" className="reset-link">Back to Log In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 