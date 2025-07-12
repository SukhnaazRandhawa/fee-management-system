import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/classes/';

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

const getClassById = (id) => {
    return axios.get(API_URL + id, { headers: getAuthHeader() });
};

const addClass = (classData) => {
    return axios.post(API_URL, classData, { headers: getAuthHeader() });
};

const getFeeHistoryYears = (classId) => {
    return axios.get(API_URL + classId + '/fee-history-years', { headers: getAuthHeader() });
};

const getFeeHistory = (classId, year) => {
    return axios.get(API_URL + `${classId}/fee-history?year=${year}`, { headers: getAuthHeader() });
};

const importStudents = (classId, importData) => {
    return axios.post(API_URL + `${classId}/import-students`, importData, { headers: getAuthHeader() });
};

const getAllClassesForHistory = () => {
    return axios.get(API_URL + 'all-for-history', { headers: getAuthHeader() });
};

const getArchivedClassesForYear = (year) => {
    return axios.get(API_URL + `archived-for-year?year=${year}`, { headers: getAuthHeader() });
};

const classService = {
    getClasses,
    updateClass,
    getClassById,
    addClass,
    getFeeHistoryYears,
    getFeeHistory,
    importStudents,
    getAllClassesForHistory,
    getArchivedClassesForYear,
};

export default classService; 