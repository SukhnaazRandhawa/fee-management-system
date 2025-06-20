import axios from 'axios';

const API_URL = 'http://localhost:5050/api/dashboard/';

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

const dashboardService = {
    getSummary,
};

export default dashboardService; 