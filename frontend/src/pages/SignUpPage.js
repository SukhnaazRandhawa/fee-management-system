import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './SignUpPage.css';

const SignUpPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    school_email: '',
    principal_email: '',
    location: '',
    numClasses: '',
    principal_password: '',
    staff_password: '',
    confirmPrincipalPassword: '',
    confirmStaffPassword: '',
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = () => {
    setStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.principal_password !== formData.confirmPrincipalPassword) {
      alert("Principal passwords do not match!");
      return;
    }
    if (formData.staff_password !== formData.confirmStaffPassword) {
      alert("Staff passwords do not match!");
      return;
    }
    try {
      const response = await authService.register(
        formData.name,
        formData.school_email,
        formData.principal_email,
        formData.location,
        formData.numClasses,
        formData.principal_password,
        formData.staff_password
      );
      console.log(response.data);
      alert('School registered successfully! Please log in.');
      navigate('/login');
    } catch (error) {
      console.error('Registration failed:', error.response?.data?.error || error.message);
      alert('Registration failed: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="signup-bg">
      <div className="signup-card">
        <h1 className="signup-title">Create account for your School</h1>
        <p className="signup-step">Step {step} of 2</p>
        <form onSubmit={handleSubmit} className="signup-form">
          {step === 1 && (
            <>
              <label className="signup-label">What's the name of your school?</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="signup-input"
              />
              <label className="signup-label">Your School's Email Address (for staff login)</label>
              <input
                type="email"
                name="school_email"
                value={formData.school_email}
                onChange={handleChange}
                required
                className="signup-input"
              />
              <label className="signup-label">Principal's Email Address (for principal login)</label>
              <input
                type="email"
                name="principal_email"
                value={formData.principal_email}
                onChange={handleChange}
                required
                className="signup-input"
              />
              <label className="signup-label">School Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="signup-input"
              />
              <label className="signup-label">How many classes do you have?</label>
              <input
                type="number"
                name="numClasses"
                value={formData.numClasses}
                onChange={handleChange}
                required
                className="signup-input"
              />
              <button type="button" className="signup-btn-primary" onClick={handleNextStep}>Continue</button>
            </>
          )}

          {step === 2 && (
            <>
              <label className="signup-label">Create principal password</label>
              <input
                type="password"
                name="principal_password"
                value={formData.principal_password}
                onChange={handleChange}
                required
                className="signup-input"
              />
              <label className="signup-label">Confirm principal password</label>
              <input
                type="password"
                name="confirmPrincipalPassword"
                value={formData.confirmPrincipalPassword}
                onChange={handleChange}
                required
                className="signup-input"
              />
              <label className="signup-label">Create staff password</label>
              <input
                type="password"
                name="staff_password"
                value={formData.staff_password}
                onChange={handleChange}
                required
                className="signup-input"
              />
              <label className="signup-label">Confirm staff password</label>
              <input
                type="password"
                name="confirmStaffPassword"
                value={formData.confirmStaffPassword}
                onChange={handleChange}
                required
                className="signup-input"
              />
              <button type="submit" className="signup-btn-primary">Continue</button>
            </>
          )}
        </form>
        <div>
          <p className="signup-link">
            Already have an account? <Link to="/login">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage; 