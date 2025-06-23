import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import authService from '../services/authService';

const ResetPasswordPage = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setMessage('');

    try {
      await authService.resetPassword(token, formData.password);
      setMessage('Your password has been reset successfully! You can now log in.');
      setTimeout(() => navigate('/login'), 3000); // Redirect after 3 seconds
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    }
  };

  return (
    <div>
      <h1>Reset Your Password</h1>
      <p>Enter your new password below.</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>New Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Confirm New Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Reset Password</button>
      </form>
      {message && <div style={{ color: 'green', marginTop: '1rem' }}>{message}</div>}
      {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
       <div style={{ marginTop: '1rem' }}>
        <Link to="/login">Back to Log In</Link>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 