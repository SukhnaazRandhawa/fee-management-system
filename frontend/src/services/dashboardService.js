import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/api/dashboard/';

const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        return { Authorization: 'Bearer ' + user.token };
    } else {
        return {};
    }
};

const getSummary = () => {
    return axios.get(API_URL + 'summary', { headers: getAuthHeader() });
};

const getOverdueStudents = () => {
    return axios.get(API_URL + 'overdue', { headers: getAuthHeader() });
};

const getLoginHistory = () => {
    return axios.get(API_URL + 'login-history', { headers: getAuthHeader() });
};

const dashboardService = {
    getSummary,
    getOverdueStudents,
    getLoginHistory,
};

export default dashboardService; 