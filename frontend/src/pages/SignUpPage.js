import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import countryList from 'react-select-country-list';
import EducationSVG from '../assets/education.svg';
import SchoolSVG from '../assets/school.svg';
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

const passwordRequirements = [
  {
    label: 'At least 8 characters',
    test: (pw) => pw.length >= 8,
    key: 'length',
  },
  {
    label: 'At least one uppercase letter',
    test: (pw) => /[A-Z]/.test(pw),
    key: 'uppercase',
  },
  {
    label: 'At least one lowercase letter',
    test: (pw) => /[a-z]/.test(pw),
    key: 'lowercase',
  },
  {
    label: 'At least one number',
    test: (pw) => /[0-9]/.test(pw),
    key: 'number',
  },
  {
    label: 'At least one special character (!@#$%^&)',
    test: (pw) => /[!@#$%^&]/.test(pw),
    key: 'special',
  },
];

function getPasswordStrength(pw) {
  let score = 0;
  passwordRequirements.forEach(req => {
    if (req.test(pw)) score++;
  });
  if (!pw) return { label: '', color: '', score: 0 };
  if (score <= 2) return { label: 'Weak', color: '#EF4444', score };
  if (score === 3 || score === 4) return { label: 'Medium', color: '#F59E42', score };
  if (score === 5) return { label: 'Strong', color: '#22C55E', score };
  return { label: '', color: '', score };
}

const PasswordStrength = ({ password }) => {
  const { label, color, score } = getPasswordStrength(password);
  return (
    <div className="pw-strength-container">
      <div className="pw-strength-bar-bg">
        <div
          className="pw-strength-bar"
          style={{ width: `${(score/5)*100}%`, background: color }}
        />
      </div>
      <span className="pw-strength-label" style={{ color }}>{label}</span>
    </div>
  );
};

const PasswordChecklist = ({ password }) => (
  <ul className="pw-checklist">
    {passwordRequirements.map(req => (
      <li key={req.key} className={req.test(password) ? 'met' : 'unmet'}>
        {req.test(password) ? '✔' : '✖'} {req.label}
      </li>
    ))}
  </ul>
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
    country: '',
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
    if (!formData.country) newErrors.country = 'Country is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswords = () => {
    const newErrors = {};
    // Principal password
    const principalStrength = getPasswordStrength(formData.principal_password);
    if (principalStrength.score < 5) {
      newErrors.principal_password = 'Principal password is not strong enough.';
    }
    if (formData.principal_password !== formData.confirmPrincipalPassword) {
      newErrors.confirmPrincipalPassword = 'Principal passwords do not match!';
    }
    // Staff password
    const staffStrength = getPasswordStrength(formData.staff_password);
    if (staffStrength.score < 5) {
      newErrors.staff_password = 'Staff password is not strong enough.';
    }
    if (formData.staff_password !== formData.confirmStaffPassword) {
      newErrors.confirmStaffPassword = 'Staff passwords do not match!';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswords()) return;
    try {
      await authService.register(
        formData.name,
        formData.school_email,
        formData.principal_email,
        formData.location,
        formData.numClasses,
        formData.principal_password,
        formData.staff_password,
        formData.country
      );
      alert('School registered successfully! Please log in.');
      navigate('/login');
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.error || error.message));
    }
  };

  // This gives you an array of all country/currency objects
  const countries = countryList().getData(); // [{ value: 'US', label: 'United States' }, ...]

  // Debug: log the countries array
  //console.log('Countries for dropdown:', countries);

  return (
    <div className="signup-bg">
      <img src={SchoolSVG} alt="School illustration" className="side-illustration left" />
      <div className="signup-card">
        <BilloraLogo />
        <div className="signup-stepper">
          <div className={`step-dot${step === 1 ? ' active' : ''}`}></div>
          <div className={`step-dot${step === 2 ? ' active' : ''}`}></div>
        </div>
        <h1 className="signup-title">Create account for your School</h1>
        <p className="signup-step">Step {step} of 2</p>
        <form onSubmit={handleSubmit} className="signup-form" autoComplete="on">
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
              <label className="signup-label">Country</label>
              <select
                name="country"
                value={formData.country || ''}
                onChange={handleChange}
                required
                className={`signup-input${errors.country ? ' input-error' : ''}`}
              >
                <option value="">Select Country</option>
                {countries.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {errors.country && <div className="signup-error">{errors.country}</div>}
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
                className={`signup-input${errors.principal_password ? ' input-error' : ''}`}
                autoComplete="new-password"
              />
              <PasswordStrength password={formData.principal_password} />
              <PasswordChecklist password={formData.principal_password} />
              {errors.principal_password && <div className="signup-error">{errors.principal_password}</div>}
              <label className="signup-label">Confirm principal password</label>
              <input
                type="password"
                name="confirmPrincipalPassword"
                value={formData.confirmPrincipalPassword}
                onChange={handleChange}
                required
                className={`signup-input${errors.confirmPrincipalPassword ? ' input-error' : ''}`}
                autoComplete="new-password"
              />
              {errors.confirmPrincipalPassword && <div className="signup-error">{errors.confirmPrincipalPassword}</div>}
              <label className="signup-label">Create staff password</label>
              <input
                type="password"
                name="staff_password"
                value={formData.staff_password}
                onChange={handleChange}
                required
                className={`signup-input${errors.staff_password ? ' input-error' : ''}`}
                autoComplete="new-password"
              />
              <PasswordStrength password={formData.staff_password} />
              <PasswordChecklist password={formData.staff_password} />
              {errors.staff_password && <div className="signup-error">{errors.staff_password}</div>}
              <label className="signup-label">Confirm staff password</label>
              <input
                type="password"
                name="confirmStaffPassword"
                value={formData.confirmStaffPassword}
                onChange={handleChange}
                required
                className={`signup-input${errors.confirmStaffPassword ? ' input-error' : ''}`}
                autoComplete="new-password"
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
      <img src={EducationSVG} alt="Education illustration" className="side-illustration right" />
    </div>
  );
};

export default SignUpPage; 