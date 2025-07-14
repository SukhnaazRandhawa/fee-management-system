import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/api/students/';

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

const updateStudent = (id, data) => {
    return axios.put(API_URL + id, data, { headers: getAuthHeader() });
};

const deleteStudent = (id) => {
    return axios.delete(API_URL + id, { headers: getAuthHeader() });
};

const studentService = {
    registerStudent,
    searchStudent,
    getStudentsByClass,
    updateStudent,
    deleteStudent,
};

export default studentService; 