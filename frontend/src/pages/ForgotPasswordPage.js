import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';

const ForgotPasswordPage = () => {
  const [schoolName, setSchoolName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await authService.forgotPassword(schoolName, email); 
      setMessage('If a school with that name and email exists, a password reset link has been sent. Please check your server console for the reset token.');
      setSchoolName('');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred.');
    }
  };

  return (
    <div>
      <h1>Forgot Password</h1>
      <p>Enter your school's name and email to receive a password reset link.</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>School Name</label>
          <input
            type="text"
            name="schoolName"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Email Address</label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit">Send Reset Link</button>
      </form>
      {message && <div style={{ color: 'green', marginTop: '1rem' }}>{message}</div>}
      {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
      <div style={{ marginTop: '1rem' }}>
        <Link to="/login">Back to Log In</Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 