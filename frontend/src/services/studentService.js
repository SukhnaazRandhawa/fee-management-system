import axios from 'axios';

const API_URL = 'http://localhost:5050/api/students/';

const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        return { Authorization: 'Bearer ' + user.token };
    } else {
        return {};
    }
};

const registerStudent = (studentData) => {
    return axios.post(API_URL + 'register', studentData, { headers: getAuthHeader() });
};

const searchStudent = (searchData) => {
    return axios.post(API_URL + 'search', searchData, { headers: getAuthHeader() });
};

const getStudentsByClass = (classId) => {
    return axios.get(API_URL + `?classId=${classId}`, { headers: getAuthHeader() });
};

const studentService = {
    registerStudent,
    searchStudent,
    getStudentsByClass,
};

export default studentService; 