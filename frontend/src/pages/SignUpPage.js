import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './SignUpPage.css';

const BilloraLogo = () => (
  <div className="signup-logo" aria-label="Billora logo">
    {/* Placeholder SVG logo, you can replace with your own */}
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="40" height="32" rx="8" fill="#5E2CA5"/>
      <rect x="10" y="14" width="28" height="20" rx="4" fill="#F9F1FF"/>
      <circle cx="24" cy="24" r="4" fill="#F72585"/>
    </svg>
  </div>
);

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
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'School name is required.';
    if (!formData.school_email) newErrors.school_email = 'Staff email is required.';
    if (!formData.principal_email) newErrors.principal_email = 'Principal email is required.';
    if (!formData.location) newErrors.location = 'Location is required.';
    if (!formData.numClasses) newErrors.numClasses = 'Number of classes is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (formData.principal_password !== formData.confirmPrincipalPassword) {
      newErrors.confirmPrincipalPassword = 'Principal passwords do not match!';
    }
    if (formData.staff_password !== formData.confirmStaffPassword) {
      newErrors.confirmStaffPassword = 'Staff passwords do not match!';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    try {
      await authService.register(
        formData.name,
        formData.school_email,
        formData.principal_email,
        formData.location,
        formData.numClasses,
        formData.principal_password,
        formData.staff_password
      );
      alert('School registered successfully! Please log in.');
      navigate('/login');
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="signup-bg">
      <div className="signup-card">
        <BilloraLogo />
        <div className="signup-stepper">
          <div className={`step-dot${step === 1 ? ' active' : ''}`}></div>
          <div className={`step-dot${step === 2 ? ' active' : ''}`}></div>
        </div>
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
                className={`signup-input${errors.name ? ' input-error' : ''}`}
              />
              {errors.name && <div className="signup-error">{errors.name}</div>}
              <label className="signup-label">Your School's Email Address (for staff login)</label>
              <input
                type="email"
                name="school_email"
                value={formData.school_email}
                onChange={handleChange}
                required
                className={`signup-input${errors.school_email ? ' input-error' : ''}`}
              />
              {errors.school_email && <div className="signup-error">{errors.school_email}</div>}
              <label className="signup-label">Principal's Email Address (for principal login)</label>
              <input
                type="email"
                name="principal_email"
                value={formData.principal_email}
                onChange={handleChange}
                required
                className={`signup-input${errors.principal_email ? ' input-error' : ''}`}
              />
              {errors.principal_email && <div className="signup-error">{errors.principal_email}</div>}
              <label className="signup-label">School Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className={`signup-input${errors.location ? ' input-error' : ''}`}
              />
              {errors.location && <div className="signup-error">{errors.location}</div>}
              <label className="signup-label">How many classes do you have?</label>
              <input
                type="number"
                name="numClasses"
                value={formData.numClasses}
                onChange={handleChange}
                required
                className={`signup-input${errors.numClasses ? ' input-error' : ''}`}
              />
              {errors.numClasses && <div className="signup-error">{errors.numClasses}</div>}
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
                className={`signup-input${errors.confirmPrincipalPassword ? ' input-error' : ''}`}
              />
              {errors.confirmPrincipalPassword && <div className="signup-error">{errors.confirmPrincipalPassword}</div>}
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
                className={`signup-input${errors.confirmStaffPassword ? ' input-error' : ''}`}
              />
              {errors.confirmStaffPassword && <div className="signup-error">{errors.confirmStaffPassword}</div>}
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