import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/api/auth/';

const register = (name, school_email, principal_email, location, numClasses, principal_password, staff_password, country) => {
  return axios.post(API_URL + 'register', {
    name,
    school_email,
    principal_email,
    location,
    numClasses,
    principal_password,
    staff_password,
    country,
  });
};

const login = (name, password) => {
  return axios.post(API_URL + 'login', {
    name,
    password,
  });
};

const logout = () => {
  localStorage.removeItem('user');
};

const forgotPassword = (name, email) => {
  return axios.post(API_URL + 'forgot-password', { name, email });
};

const resetPassword = (token, password) => {
  return axios.post(API_URL + `reset-password/${token}`, { password });
};

const userLogin = (email, password) => {
  return axios.post(API_URL + 'user-login', { email, password });
};

const authService = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  userLogin,
};

export default authService; 