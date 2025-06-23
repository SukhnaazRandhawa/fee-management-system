import axios from 'axios';

const API_URL = 'http://localhost:5050/api/auth/';

const register = (name, email, numClasses, password) => {
  return axios.post(API_URL + 'register', {
    name,
    email,
    numClasses,
    password,
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

const authService = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
};

export default authService; 