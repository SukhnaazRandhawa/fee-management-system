import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const SignUpPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    numClasses: '',
    password: '',
    confirmPassword: '',
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
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    
    try {
      const response = await authService.register(
        formData.name,
        formData.numClasses,
        formData.password
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
    <div>
      <h1>Create account for your School</h1>
      <p>Step {step} of 2</p>
      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div>
            <label>What's the name of your school?</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <label>How many classes do you have?</label>
            <input
              type="number"
              name="numClasses"
              value={formData.numClasses}
              onChange={handleChange}
              required
            />
            <button type="button" onClick={handleNextStep}>Continue</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <label>Create your password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <label>Confirm your password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <button type="submit">Continue</button>
          </div>
        )}
      </form>
    </div>
  );
};

export default SignUpPage; 