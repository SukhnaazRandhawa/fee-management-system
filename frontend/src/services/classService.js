import axios from 'axios';

const API_URL = 'http://localhost:5050/api/classes/';

// We need a function to get the token from localStorage
const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        return { Authorization: 'Bearer ' + user.token };
    } else {
        return {};
    }
};

const getClasses = () => {
    return axios.get(API_URL, { headers: getAuthHeader() });
};

const updateClass = (id, classData) => {
    return axios.put(API_URL + id, classData, { headers: getAuthHeader() });
};

const classService = {
    getClasses,
    updateClass,
};

export default classService; 