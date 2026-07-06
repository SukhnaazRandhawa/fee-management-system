import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/api/reports/';

const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        return { Authorization: 'Bearer ' + user.token };
    } else {
        return {};
    }
};

const getCollectionsCsv = (period) => {
    return axios.get(API_URL + `collections?period=${period}`, { headers: getAuthHeader(), responseType: 'blob' });
};

const getDuesCsv = () => {
    return axios.get(API_URL + 'dues', { headers: getAuthHeader(), responseType: 'blob' });
};

const reportService = {
    getCollectionsCsv,
    getDuesCsv,
};

export default reportService;
