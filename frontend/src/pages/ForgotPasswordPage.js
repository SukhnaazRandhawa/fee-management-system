import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import './ForgotPasswordPage.css';

const BilloraLogo = () => (
  <div className="forgot-logo" aria-label="Billora logo">
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="40" height="32" rx="8" fill="#5E2CA5"/>
      <rect x="10" y="14" width="28" height="20" rx="4" fill="#F9F1FF"/>
      <circle cx="24" cy="24" r="4" fill="#F72585"/>
    </svg>
  </div>
);

const ForgotPasswordPage = () => {
  const [form, setForm] = useState({ schoolName: '', email: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await authService.forgotPassword(form.schoolName, form.email); 
      setMessage('If an account with that school and email exists, a password reset link has been sent.');
      setForm({ schoolName: '', email: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred.');
    }
  };

  return (
    <div className="forgot-bg">
      <div className="forgot-card">
        <BilloraLogo />
        <h1 className="forgot-title">Forgot Password</h1>
        <p>Enter your school's name and email to receive a password reset link.</p>
        <form onSubmit={handleSubmit} className="forgot-form">
          <div>
            <label className="forgot-label">School Name</label>
            <input
              type="text"
              name="schoolName"
              value={form.schoolName}
              onChange={handleChange}
              required
              className="forgot-input"
            />
          </div>
          <div>
            <label className="forgot-label">Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="forgot-input"
            />
          </div>
          <button type="submit" className="forgot-btn-primary">Send Reset Link</button>
        </form>
        {message && <div className="forgot-success">{message}</div>}
        {error && <div className="forgot-error">{error}</div>}
        <div>
          <Link to="/login" className="forgot-link">Back to Log In</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 