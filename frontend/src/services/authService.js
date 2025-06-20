import axios from 'axios';

const API_URL = 'http://localhost:5050/api/auth/';

const register = (name, numClasses, password) => {
  return axios.post(API_URL + 'register', {
    name,
    numClasses,
    password,
  });
};

const authService = {
  register,
};

export default authService; 