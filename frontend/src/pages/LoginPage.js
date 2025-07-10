import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MobileLoginSVG from '../assets/mobile-login.svg';
import { AuthContext } from '../context/AuthContext';
import './LoginPage.css';

const BilloraLogo = () => (
  <div className="login-logo" aria-label="Billora logo">
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="40" height="32" rx="8" fill="#5E2CA5"/>
      <rect x="10" y="14" width="28" height="20" rx="4" fill="#F9F1FF"/>
      <circle cx="24" cy="24" r="4" fill="#F72585"/>
    </svg>
  </div>
);

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard'); // Redirect to dashboard on successful login
    } catch (error) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-bg-row">
      <div className="login-illustration-col">
        <img src={MobileLoginSVG} alt="Login illustration" className="login-illustration" />
      </div>
      <div className="login-card-col">
        <div className="login-card">
          <BilloraLogo />
          <h1 className="login-title">Log In</h1>
          <form onSubmit={handleSubmit} className="login-form">
            <label className="login-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="login-input"
            />
            <label className="login-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="login-input"
            />
            <button type="submit" className="login-btn-primary">Log In</button>
          </form>
          {error && <div className="login-error">{error}</div>}
          <div>
            <p className="login-link">
              <Link to="/forgot-password">Forgot Password?</Link>
            </p>
            <p className="login-link">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 